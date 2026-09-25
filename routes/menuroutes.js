import express from "express";
import {
  getMenu,
  createMenu,
  initMenu,
} from "../controllers/menuItemController.js";
import { admin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getMenu);

router.post("/", admin, protect, createMenu);
router.post("/init", initMenu);

export default router;
