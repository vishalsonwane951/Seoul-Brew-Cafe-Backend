import express from "express";
import { chatMessage } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/message", protect, chatMessage);

export default router;
