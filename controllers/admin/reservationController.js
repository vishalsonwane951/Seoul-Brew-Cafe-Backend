import Reservation from "../../models/Reservation.js";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      table,
      date,
      time,
      guests,
      specialRequest,
    } = req.body;

    const reservation = new Reservation({
      user: req.user?._id || null,
      customerName,
      email,
      phone,
      date,
      time,
      guests,
      specialRequest,
      table,
      status: "Pending",
    });

    const savedReservation = await reservation.save();

    req.io.emit("reservations:updated");

    res.status(201).json({
      success: true,
      reservation: {
        _id: savedReservation._id,
        customerName: savedReservation.customerName,
        email: savedReservation.email,
        phone: savedReservation.phone,
        date: savedReservation.date,
        time: savedReservation.time,
        table: savedReservation.table,
        guests: savedReservation.guests,
        specialRequest: savedReservation.specialRequest,
        status: savedReservation.status,
      },
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ _id: -1 }).lean();
    return res.status(200).json(reservations);
  } catch (err) {
    console.error("getAllReservations:", err);
    return res.status(500).json({ message: "Failed to fetch reservations" });
  }
};

// Get All Reservations (with optional date filter)
export const getReservationsByDate = async (req, res) => {
  try {
    const { date } = req.params;

    if (!DATE_RE.test(date)) {
      return res
        .status(400)
        .json({ message: "Invalid date. Use the format YYYY-MM-DD." });
    }
    const reservations = await Reservation.find({
      date: { $regex: `^${date}` },
    })
      .sort({ _id: -1 })
      .lean();

    return res.status(200).json(reservations);
  } catch (err) {
    console.error("getReservationsByDate:", err);
    return res.status(500).json({ message: "Failed to fetch reservations" });
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
    if (req.body.table) reservation.table = req.body.table;

    const updatedReservation = await reservation.save();

    req.io.emit("reservations:updated");

    res.json(updatedReservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Reservation Details
export const updateReservation = async (req, res) => {
  try {
    const {
      customerName,
      email,
      phone,
      date,
      time,
      guests,
      table,
      specialRequest,
    } = req.body;

    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      { customerName, email, phone, date, time, guests, table, specialRequest },
      { new: true },
    ).lean();

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }
    req.io.emit("reservations:updated");

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete Reservation
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: "Reservation not found" });
    }

    req.io.emit("reservations:updated");

    res.json({ success: true, message: "Reservation deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
