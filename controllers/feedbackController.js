import Feedback from "../models/feedback.js";

// POST /api/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { message, rating, name } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Feedback message is required." });
    }

    const feedback = await Feedback.create({
      user: req.user._id,
      name: (name && name.trim()) || req.user.name,
      message: message.trim(),
      rating: rating || 5,
    });

    res.status(201).json(feedback);
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Failed to submit feedback." });
  }
};

export const getMyFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json(feedback);
  } catch (err) {
    res
      .status(500)
      .json({ message: err.message || "Failed to fetch feedback." });
  }
};

// GET /api/feedback
export const getAllFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .lean();
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
