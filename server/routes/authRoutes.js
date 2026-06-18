import express from "express";
const router = express.Router();
import authController from "../controllers/authController.js";

//Register a new user
router.post("/register", authController.register);

//Login a user
router.post("/login", authController.login);

//Vefify OTP
router.post("/verify-otp", authController.verifyOtp);


export default router;