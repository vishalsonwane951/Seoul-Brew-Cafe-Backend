import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    rating: { type: Number, min: 1, max: 5, default: 5 },
  },
  { timestamps: true },
);

feedbackSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
