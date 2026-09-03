import { GoogleGenAI } from "@google/genai";
import EmailHistory from "../models/EmailHistory.js";
import redisClient from "../config/redisClient.js";

export const generateEmail = async (req, res) => {
  console.log("REQUEST RECEIVED");
  console.log("Headers:", req.headers);
  console.log("INCOMING BODY: ", req.body);
  console.log("User Info:", req.user);
  
  try {
    const { prompt } = req.body;
    console.log("Extracted prompt:", prompt);

    if (!prompt) {
      console.log("Validation failed: Prompt is required");
      return res.status(400).json({ message: "Prompt is required" });
    }

    if (typeof prompt !== "string") {
      console.log("Validation failed: Prompt must be a string");
      return res.status(400).json({ message: "Prompt must be a string" });
    }

    if (prompt.trim().length === 0) {
      console.log("Validation failed: Prompt cannot be empty");
      return res.status(400).json({ message: "Prompt cannot be empty" });
    }

    if (prompt.length > 2000) {
      console.log("Validation failed: Prompt too long");
      return res
        .status(400)
        .json({ message: "Prompt cannot exceed 2000 characters" });
    }

    // First I will check if this specific prompt is already cached in Redis
    const normalizedPrompt = prompt.trim().toLowerCase();
    const promptCacheKey = `ai_prompt:${normalizedPrompt}`;
    const cachedAIResponse = await redisClient.get(promptCacheKey);

    let emailData;

    if (cachedAIResponse) {
      console.log("CACHE HIT: Serving AI response from Redis");
      emailData = JSON.parse(cachedAIResponse);
    } else {
      console.log("CACHE MISS: Calling Gemini API...");
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ message: "AI service is not configured. Missing GEMINI_API_KEY." });
      }

      // Initialize Gemini explicitly after environment loads
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

• 6–9 words
• Must sound confident
• No generic phrases like:
  - "Quick question"
  - "Looking for opportunity"
  - "Job application"
• Should highlight value or experience

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
• Confident
• Professional
• Not desperate
• No emojis
• No hype words

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

      // Combine system prompt and user prompt into one string
      const fullPrompt = `${systemPrompt}\n\nUser REQUEST: "${prompt.trim()}"\n\nGenerate STRONG cold email even if prompt is short. Make smart assumptions.`;
      
      // FIX APPLIED HERE: Stripped down to ONLY model and input parameters
      const interaction = await ai.interactions.create({
        model: "gemini-3.6-flash",
        input: fullPrompt
      });

      if (!interaction.output_text) {
        throw new Error("Invalid response from Gemini API");
      }

      const generatedText = interaction.output_text;
      let parsedResponse;

      try {
        // Re-added the regex parser to safely extract JSON if Gemini wraps it in markdown blocks
        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        parsedResponse = jsonMatch
          ? JSON.parse(jsonMatch[0])
          : JSON.parse(generatedText);
      } catch (parseError) {
        console.error(
          "JSON parse error:",
          parseError,
          "Generated text:",
          generatedText
        );
        return res.status(500).json({
          message: "Failed to parse AI response",
          error: "The AI generated invalid JSON. Please try again.",
        });
      }

      emailData = {
        subject: parsedResponse.subject || "New Opportunity",
        emailBody: parsedResponse.emailBody || "",
        linkedInDM: parsedResponse.linkedInDM || "",
        followUpEmail: parsedResponse.followUpEmail || "",
      };

      if (!emailData.subject || !emailData.emailBody) {
        return res.status(500).json({
          message: "AI generated incomplete email data. Please try again.",
        });
      }

      // Save the AI response to Redis for 1 hour
      await redisClient.set(promptCacheKey, JSON.stringify(emailData), {
        EX: 3600,
      });
    }

    // Save the generated email to mongoDB for the user
    const historyEntry = await EmailHistory.create({
      user: req.user._id,
      prompt: prompt.trim(),
      subject: emailData.subject,
      emailBody: emailData.emailBody,
      linkedInDM: emailData.linkedInDM,
      followUpEmail: emailData.followUpEmail,
    });

    // Delete the saved email history from redis so it fetches the new entry
    const userHistoryCacheKey = `user_history:${req.user._id}`;
    await redisClient.del(userHistoryCacheKey);

    res.status(200).json(historyEntry);
    
  } catch (error) {
    console.error(
      "AI Generation Error:",
      error.message
    );

    if (error.message && error.message.includes("429")) {
      return res.status(429).json({
        message: "Too many requests. Please wait a moment before trying again.",
        error: "Rate limit exceeded",
      });
    }

    res.status(500).json({
      message: "Failed to generate email",
      error: error.message || "Unknown error occurred",
    });
  }
};

export const getHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const historyCacheKey = `user_history:${userId}`;

    const cachedHistory = await redisClient.get(historyCacheKey);

    if (cachedHistory) {
      console.log("CACHE HIT: Serving User History from Redis");
      return res.status(200).json(JSON.parse(cachedHistory));
    }

    console.log("CACHE MISS: Fetching User History from MongoDB");
    
    const history = await EmailHistory.find({ user: userId }).sort({
      createdAt: -1,
    });

    await redisClient.set(historyCacheKey, JSON.stringify(history), {
      EX: 900,
    });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
};