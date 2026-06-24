import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

//load env variables
dotenv.config();

const PORT = process.env.PORT || 3000;
//connect to database
connectDB();

const app = express();

app.use(cors());

//middleware to parse JSON bodies
app.use(express.json({ limit: "10mb" }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`📨 [${req.method}] ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

app.use("/api/auth", authRoutes); // when anyone hits /api/auth, it will be sent to authRoutes page

app.use("/api/ai", aiRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({ message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
