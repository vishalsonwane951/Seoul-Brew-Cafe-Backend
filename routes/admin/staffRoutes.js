import express from "express";
import {
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
} from "../../controllers/admin/staffController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";
import { staffUpload } from "../../middleware/uploadMiddleware.js";

const router = express.Router();

// All staff management routes require an authenticated admin
router.get("/", protect, admin, getStaff);
router.post("/", protect, admin, staffUpload, createStaff);
router.put("/:id", protect, admin, staffUpload, updateStaff);
router.delete("/:id", protect, admin, deleteStaff);
router.patch("/:id/status", protect, admin, updateStaffStatus);

export default router;

