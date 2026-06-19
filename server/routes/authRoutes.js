import express from "express";
const router = express.Router();
import * as authController from "../controllers/authController.js";

//Register a new user
router.post("/register", authController.registerUser);

//Login a user
router.post("/login", authController.loginUser);

//Vefify OTP
router.post("/verify-otp", authController.verifyOtp);


export default router;