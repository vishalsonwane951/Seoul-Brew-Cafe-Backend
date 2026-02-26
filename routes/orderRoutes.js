import express from "express";
import {
  placeOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getOrderById ,
  advanceOrderStatus,
  cancelOrder
} from "../controllers/orderController.js";
import { admin, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, placeOrder);
router.patch("/:id/cancel", protect, cancelOrder);

// Admin routed

router.get("/", protect, admin, getOrders);
router.get("/:id",admin, getOrder);
router.patch("/:id/advance", advanceOrderStatus);
router.put("/:orderId/status", updateOrderStatus);


router.get("/my-orders", protect, getOrderById );

export default router;