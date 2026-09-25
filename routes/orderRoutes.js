import express from "express";
import {
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getMyOrders,
  advanceOrderStatus,
  cancelOrder,
} from "../controllers/orderController.js";
import { admin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.patch("/:id/cancel", protect, cancelOrder);

router.get("/my-orders", protect, getMyOrders);

router.get("/", protect, admin, getOrders);
router.get("/:id", protect, getOrder);
router.patch("/:id/advance", protect, admin, advanceOrderStatus);
router.put("/:orderId/status", protect, admin, updateOrderStatus);

export default router;
