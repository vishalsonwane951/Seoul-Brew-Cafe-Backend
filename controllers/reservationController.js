import Reservation from "../models/Reservation.js";

// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    const savedReservation = await reservation.save();
    res.status(201).json(savedReservation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get All Reservations
export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({});
    res.json(reservations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Reservation Status
export const updateReservationStatus = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    reservation.status = req.body.status;
    const updatedReservation = await reservation.save();

    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};