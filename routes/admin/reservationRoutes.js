import express from "express";
import {
  getReservations,
  updateReservationStatus,
  deleteReservation,
} from "../../controllers/admin/reservationController.js";

import { admin, protect } from '../../middleware/authMiddleware.js'

const router = express.Router();

router.get("/",protect, admin, getReservations);

router.put("/:id/status",protect,admin, updateReservationStatus);

router.delete("/:id/delete",protect,admin, deleteReservation);

export default router;