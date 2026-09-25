import express from "express";
import {
  createReservation,
  updateReservationStatus,
  getMyReservations,
  // cancelMyReservation,
} from "../controllers/reservationController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.post("/", optionalAuth, createReservation);
router.get("/my-reservations", protect, getMyReservations);
router.put("/:id", updateReservationStatus);

export default router;
