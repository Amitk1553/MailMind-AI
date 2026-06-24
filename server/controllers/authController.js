import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "../utils/sendOtpEmail.js";

// FIX 1: Pass the userId as an argument instead of using 'this._id'
const generateAuthToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "24h", // Increased to 24h so you don't get constantly logged out during development
  });
};

export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); 

    const user = await User.create({
      username,
      email,
      password,
      otp,
      otpExpiry,
    }); 
    
    res.status(201).json({ message: "User registered successfully", user: { username: user.username, email: user.email } });

    try {
      await sendOtpEmail({
        to: email,
        subject: "Your OTP Code for MailMind AI",
        text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
      });
    } catch (error) {
      console.log({ message: "Error sending OTP", error: error.message });
    }
  } catch (error) {
    console.error("REGISTRATION ERROR: ", error);
    res.status(500).json({ message: "Error registering user" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    
    const user = await User.findOne({ email }).select("+otp +otpExpiry");
    
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified" });
    }
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }
    
    user.isVerified = true;
    // Clear OTP fields after successful verification to save DB space and prevent reuse
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();
    
    // Generate token upon verification so the user doesn't have to log in manually right after signing up
    const token = generateAuthToken(user._id);

    res.status(200).json({ 
        message: "OTP verified successfully. You are now logged in.",
        token,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email
        }
    });
  } catch (error) {
    console.error("OTP VERIFICATION ERROR: ", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    const user = await User.findOne({ email }).select("+password +isVerified");
    
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: "Please verify your email first" });
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }
    
    // FIX 3: Use the helper function and return user data
    const token = generateAuthToken(user._id);
    
    res.status(200).json({ 
        message: "Login successful", 
        token,
        user: {
            _id: user._id,
            username: user.username,
            email: user.email
        }
    });
  } catch (error) {
    console.error("LOGIN ERROR: ", error);
    res.status(500).json({ message: "Error logging in" });
  }
};