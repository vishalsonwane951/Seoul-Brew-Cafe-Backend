import express from "express";
import {
  getReservations,
  updateReservationStatus,
  deleteReservation,
} from "../../controllers/admin/reservationController.js";

import { admin, protect } from '../../middleware/authMiddleware.js'

const router = express.Router();

router.get("/",admin, getReservations);

router.put("/:id/status",protect, updateReservationStatus);

router.delete("/:id",admin, deleteReservation);

export default router;