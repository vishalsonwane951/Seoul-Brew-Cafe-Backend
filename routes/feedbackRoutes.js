import express from "express";
import {
  submitFeedback,
  getMyFeedback,
  getAllFeedback,
} from "../controllers/feedbackController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/my-feedback", protect, getMyFeedback);
router.get("/", protect, admin, getAllFeedback);
router.post("/", protect, submitFeedback);

export default router;
