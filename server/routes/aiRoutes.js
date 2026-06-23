import express from "express";
const router = express.Router();
import protect from "../middleware/authMiddleware.js";
import * as aiController from "../controllers/aiController.js";


router.post("/generate-email", protect, aiController.generateEmail);
router.get("/history", protect, aiController.getHistory);

export default router;
