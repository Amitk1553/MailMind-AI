import User from "../models/User.js";
import { sendOtpEmail } from "../utils/emailService.js";

export const registerUser = async (req, res) => {
  // Implementation for registering a new user
  try {
    const { username, email, password } = req.body;
    if(!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if(password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
    if(!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if(existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

    const user = await User.create({ username, email, password, otp, otpExpiry }); // we need to add otps and all because we defined the schema like that so we will make a func otp and otpExpiry
    res.status(201).json({ message: "User registered successfully", user });

    // OTP sending logic
    try{
        await sendOtpEmail({ //this is written in utils
            to: email,
            subject: "Your OTP Code for MailMind AI",
            text: `Your OTP code is ${otp}. It will expire in 10 minutes.`
        })
    }catch(error) {
      console.log({ message: "Error sending OTP", error: error.message });
    }
  }
  catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};