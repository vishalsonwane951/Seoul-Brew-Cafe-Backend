import express from "express";
import { getMenu, createMenu,initMenu } from "../controllers/menuItemController.js";
import { admin , protect } from '../middleware/authMiddleware.js'

const router = express.Router();

// GET /api/menu → fetch grouped menu
router.get("/", getMenu);

// POST /api/menu/add-item → add a new item to a category
router.post("/", admin, protect, createMenu);
router.post("/init", initMenu);

export default router;