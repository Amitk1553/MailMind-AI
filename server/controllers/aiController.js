import { GoogleGenAI } from "@google/genai";
import EmailHistory from "../models/EmailHistory.js";
import redisClient from "../config/redisClient.js";

// Helper function that forces a loud terminal log whenever an error is sent to the frontend
const logAndSendError = (res, statusCode, message, errorDetail = "", errorObj = null) => {
  console.error("\n================ ERROR SENT TO FRONTEND ================");
  console.error(`Timestamp   : ${new Date().toISOString()}`);
  console.error(`Status Code : ${statusCode}`);
  console.error(`UI Message  : ${message}`);
  if (errorDetail) {
    console.error(`Error Detail: ${errorDetail}`);
  }
  if (errorObj) {
    console.error(`Error Name  : ${errorObj.name}`);
    console.error(`Error Status: ${errorObj.status || errorObj.statusCode || "N/A"}`);
    if (errorObj.response?.data) {
      console.error("API Error Payload:", JSON.stringify(errorObj.response.data, null, 2));
    }
    console.error("Stack Trace :\n", errorObj.stack || errorObj);
  }
  console.error("========================================================\n");

  return res.status(statusCode).json({
    message,
    error: errorDetail || message,
  });
};

export const generateEmail = async (req, res) => {
  console.log("\n---------------- NEW GENERATE EMAIL REQUEST ----------------");
  console.log("Incoming Body:", req.body);
  console.log("User Info:", req.user);

  try {
    if (!req.user || !req.user._id) {
      return logAndSendError(
        res,
        401,
        "Unauthorized: User session invalid",
        "req.user or req.user._id is missing"
      );
    }

    const { prompt } = req.body;
    console.log("Extracted prompt:", prompt);

    if (!prompt) {
      return logAndSendError(res, 400, "Prompt is required", "Missing prompt in req.body");
    }

    if (typeof prompt !== "string") {
      return logAndSendError(
        res,
        400,
        "Prompt must be a string",
        `Received type: ${typeof prompt}`
      );
    }

    if (prompt.trim().length === 0) {
      return logAndSendError(res, 400, "Prompt cannot be empty", "Prompt string was whitespace only");
    }

    if (prompt.length > 2000) {
      return logAndSendError(
        res,
        400,
        "Prompt cannot exceed 2000 characters",
        `Prompt length was ${prompt.length}`
      );
    }

    // Step 1: Check Redis cache (non-blocking if Redis fails)
    const normalizedPrompt = prompt.trim().toLowerCase();
    const promptCacheKey = `ai_prompt:${normalizedPrompt}`;
    let cachedAIResponse = null;

    try {
      cachedAIResponse = await redisClient.get(promptCacheKey);
    } catch (redisReadError) {
      console.error("[REDIS READ ERROR]:", redisReadError.message);
    }

    let emailData;

    if (cachedAIResponse) {
      console.log("CACHE HIT: Serving AI response from Redis");
      emailData = JSON.parse(cachedAIResponse);
    } else {
      console.log("CACHE MISS: Calling Gemini API...");

      if (!process.env.GEMINI_API_KEY) {
        return logAndSendError(
          res,
          500,
          "AI service is not configured. Missing GEMINI_API_KEY.",
          "process.env.GEMINI_API_KEY is undefined or empty"
        );
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const systemPrompt = `You are an expert job outreach strategist.

Your task is to generate a HIGH-CONVERTING cold email to a recruiter for a job opportunity.

IMPORTANT:
- Even if the user gives only 2–4 words, assume realistic context.
- Do NOT ask for clarification.
- Make professional assumptions.
- Avoid generic phrases.
- Keep it concise and structured.

====================================================
OUTPUT FORMAT (STRICT)
====================================================

Return ONLY valid JSON matching this structure:

{
  "subject": "",
  "emailBody": "",
  "linkedInDM": "",
  "followUpEmail": ""
}

No markdown.
No explanations.
Only JSON.

====================================================
CONTEXT ASSUMPTIONS
====================================================

Assume:
- Candidate has 2+ years experience
- Strong in DSA and system design
- Has worked on backend APIs or scalable systems
- Has contributed to production-level features
- Actively seeking Software Engineer roles

If prompt is short like:
"SDE role"
"Backend engineer"
"Startup job"
"Product company"

Create intelligent assumptions about:
- Scaling challenges
- Hiring urgency
- Performance or system reliability issues
- Team growth

====================================================
SUBJECT LINE RULES
====================================================

- 6–9 words
- Must sound confident
- No generic phrases like:
  - "Quick question"
  - "Looking for opportunity"
  - "Job application"
- Should highlight value or experience

Example styles:
"Backend engineer with 2+ yrs scaling APIs"
"Engineer focused on scalable system design"
"Software engineer improving system performance"

====================================================
EMAIL BODY STRUCTURE (STRICT)
====================================================

Keep 60–90 words.

Line 1: Personalized observation about hiring  
Line 2: Mention common hiring/scaling challenge  
Line 3-4: Candidate's experience and strengths  
Line 5: Specific impact or contribution  
Line 6: Clear CTA  
Line 7: Sign-off with name and title  

Tone:
- Confident
- Professional
- Not desperate
- No emojis
- No hype words

====================================================
LINKEDIN DM STRUCTURE
====================================================

30–50 words.
Short, conversational.
Observation + value + soft ask.

====================================================
FOLLOW-UP EMAIL STRUCTURE
====================================================

50–80 words.
New angle.
Emphasize long-term value.
Professional urgency.
Clear CTA.`;

      const fullPrompt = `${systemPrompt}\n\nUser REQUEST: "${prompt.trim()}"\n\nGenerate STRONG cold email even if prompt is short. Make smart assumptions.`;

      const interaction = await ai.interactions.create({
        model: "gemini-3.5-flash-lite",
        input: fullPrompt,
      });

      const generatedText =
        interaction?.output_text ||
        interaction?.text ||
        interaction?.outputs?.[0]?.text ||
        "";

      if (!generatedText) {
        return logAndSendError(
          res,
          500,
          "Invalid response from Gemini API",
          `Empty output_text received. Raw interaction: ${JSON.stringify(interaction)}`
        );
      }

      let parsedResponse;

      try {
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        parsedResponse = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : JSON.parse(generatedText);
      } catch (parseError) {
        return logAndSendError(
          res,
          500,
          "Failed to parse AI response",
          `Raw AI output was not valid JSON: ${generatedText}`,
          parseError
        );
      }

      emailData = {
        subject:
          parsedResponse.subject ||
          parsedResponse.Subject ||
          "New Opportunity",
        emailBody:
          parsedResponse.emailBody ||
          parsedResponse.email_body ||
          parsedResponse.body ||
          "",
        linkedInDM:
          parsedResponse.linkedInDM ||
          parsedResponse.linkedinDM ||
          parsedResponse.linkedin_dm ||
          "",
        followUpEmail:
          parsedResponse.followUpEmail ||
          parsedResponse.follow_up_email ||
          parsedResponse.followUp ||
          "",
      };

      if (!emailData.subject || !emailData.emailBody) {
        return logAndSendError(
          res,
          500,
          "AI generated incomplete email data. Please try again.",
          `Parsed object missing subject or emailBody: ${JSON.stringify(parsedResponse)}`
        );
      }

      try {
        await redisClient.set(promptCacheKey, JSON.stringify(emailData), {
          EX: 3600,
        });
      } catch (redisWriteError) {
        console.error("[REDIS WRITE ERROR]:", redisWriteError.message);
      }
    }

    // Save the generated email to MongoDB for the user
    const historyEntry = await EmailHistory.create({
      user: req.user._id,
      prompt: prompt.trim(),
      subject: emailData.subject,
      emailBody: emailData.emailBody,
      linkedInDM: emailData.linkedInDM,
      followUpEmail: emailData.followUpEmail,
    });

    // Delete the saved email history from Redis so it fetches the new entry
    const userHistoryCacheKey = `user_history:${req.user._id}`;
    try {
      await redisClient.del(userHistoryCacheKey);
    } catch (redisDelError) {
      console.error("[REDIS DELETE ERROR]:", redisDelError.message);
    }

    console.log("SUCCESS: Email generated and saved. ID:", historyEntry._id);
    return res.status(200).json(historyEntry);

  } catch (error) {
    if (
      error.status === 429 ||
      error.statusCode === 429 ||
      (error.message && error.message.includes("429"))
    ) {
      return logAndSendError(
        res,
        429,
        "Too many requests. Please wait a moment before trying again.",
        error.message || "Rate limit exceeded",
        error
      );
    }

    return logAndSendError(
      res,
      500,
      "Failed to generate email",
      error.message || "Unknown error occurred",
      error
    );
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const historyCacheKey = `user_history:${userId}`;

    let cachedHistory = null;
    try {
      cachedHistory = await redisClient.get(historyCacheKey);
    } catch (redisReadError) {
      console.error("[REDIS HISTORY READ ERROR]:", redisReadError.message);
    }

    if (cachedHistory) {
      console.log("CACHE HIT: Serving User History from Redis");
      return res.status(200).json(JSON.parse(cachedHistory));
    }

    console.log("CACHE MISS: Fetching User History from MongoDB");

    const history = await EmailHistory.find({ user: userId }).sort({
      createdAt: -1,
    });

    try {
      await redisClient.set(historyCacheKey, JSON.stringify(history), {
        EX: 900,
      });
    } catch (redisWriteError) {
      console.error("[REDIS HISTORY WRITE ERROR]:", redisWriteError.message);
    }

    return res.status(200).json(history);
  } catch (error) {
    return logAndSendError(
      res,
      500,
      "Failed to fetch history",
      error.message,
      error
    );
  }
};