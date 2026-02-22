import express from "express";
import {
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getMyOrders
} from "../controllers/orderController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", placeOrder);
router.get("/", getOrders);
router.get("/:id", getOrder);
router.put("/:id/status", adminOnly, updateOrderStatus);

router.get("/my-orders", protect, getMyOrders);

export default router;