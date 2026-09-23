import express from "express";
import {
  getAllReservations,
  getReservationsByDate,
  updateReservationStatus,
  deleteReservation,
} from "../../controllers/admin/reservationController.js";

import { admin, protect } from '../../middleware/authMiddleware.js'

const router = express.Router();

router.get("/reservations",protect,admin, getAllReservations);
router.get("/reservations/date/:date",protect, admin, getReservationsByDate);

router.patch("/:id/status",protect,admin, updateReservationStatus);

router.delete("/:id/delete",protect,admin, deleteReservation);

export default router;