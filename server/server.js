import express from "express";
import authRoutes from "./routes/authRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
const PORT = process.env.PORT || 3000;

//env variables
dotenv.config();

//connect to database
connectDB();


const app = express();

//middleware to parse JSON bodies
app.use(express.json());

app.use("/api/auth", authRoutes); // when anyone hits /api/auth, it will be sent to authRoutes page
// app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
