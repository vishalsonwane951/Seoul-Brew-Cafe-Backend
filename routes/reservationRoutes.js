import express from "express";
import {
  createReservation,
  getReservations,
  updateReservationStatus,
  getMyReservations,
  // cancelMyReservation,
} from "../controllers/reservationController.js";
import { optionalAuth, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ optionalAuth: keeps the public website's guest reservation form
// working exactly as before, while tagging reservations made from the
// mobile app with the logged-in user so they show up under "My reservations".
router.post("/", optionalAuth, createReservation);

// ✅ NEW: mobile app "Reservation" tab
router.get("/my-reservations", protect, getMyReservations);
// router.patch("/:id/cancel", protect, cancelMyReservation);

router.get("/", getReservations);
router.put("/:id", updateReservationStatus);

export default router;
