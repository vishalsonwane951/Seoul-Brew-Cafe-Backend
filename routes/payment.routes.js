import express from "express";
import {
  initiatePayment,
  paymentRedirect,
  paymentCallback,
  checkPaymentStatus,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/initiate/:id", protect, initiatePayment);
router.get("/redirect/:merchantTransactionId", paymentRedirect);
router.post("/callback", express.json(), paymentCallback);
router.get("/status/:merchantTransactionId", protect, checkPaymentStatus);

export default router;
