import express from "express";
import {
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability
} from "../../controllers/admin/menucontroller.js";

import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

// Public route: Get all menu items (frontend can use admin token for full view)
// router.get("/", protect, admin, getMenu);

// Admin routes: require admin authorization
router.post("/", protect, admin, addMenuItem);
router.put("/:itemId", protect, admin, updateMenuItem);
router.delete("/:itemId", protect, admin, deleteMenuItem);
// router.patch("/:category/:itemId/availability", protect, admin, toggleAvailability);
router.patch('/:id/availability', toggleAvailability);

export default router;