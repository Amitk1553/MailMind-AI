import express from "express";
import authRoutes from "./routes/auth.js";
const app = express();
const PORT = process.env.PORT || 3000;


app.use('/api/auth', authRoutes); // when anyone hits /api/auth, it will be sent to authRoutes page
app.use('/api/ai', aiRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});