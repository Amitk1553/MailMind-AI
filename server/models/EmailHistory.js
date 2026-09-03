import mongoose from "mongoose";

const EmailHistorySchema = new mongoose.Schema(
  {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    emailBody: {
      type: String,
      required: true,
    },
    linkedInDM: {
      type: String,
      required: true,
    },
    followUpEmail: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

// Compound index: optimizes the getHistory query → EmailHistory.find({ user }).sort({ createdAt: -1 })
// Without this index, MongoDB would do a full collection scan + in-memory sort on every history request.
EmailHistorySchema.index({ user: 1, createdAt: -1 });

const EmailHistory = mongoose.model("EmailHistory", EmailHistorySchema);
export default EmailHistory;