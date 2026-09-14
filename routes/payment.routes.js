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
router.get("/redirect/:merchantTransactionId", paymentRedirect); // hit by PhonePe's browser redirect, no auth
router.post("/callback", express.json(), paymentCallback); // hit by PhonePe's servers, no auth
router.get("/status/:merchantTransactionId", protect, checkPaymentStatus);

export default router;