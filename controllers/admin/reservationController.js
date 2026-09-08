import Reservation from '../../models/Reservation.js';

// GET ALL RESERVATIONS
export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find().sort({ createdAt: -1 });

    const formatted = reservations.map(r => ({
      _id: r._id,
      customerName: r.customerName,
      phone: r.phone,
      date: r.date,
      time: r.time,
      guests: r.guests,
      table: r.table,          // <-- FIX: was missing entirely, so the
                                 //     frontend always received `table: undefined`
                                 //     even for reservations that had a table saved.
      notes: r.specialRequest,
      status: r.status,
    }));

    res.json({
      success: true,
      reservations: formatted,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    // FIX: was only reading `status`, so when the frontend sent
    // { status: 'Approved', table: 'T-03' } during Confirm, the `table`
    // value was silently discarded and never written to the DB.
    const { status, table } = req.body;

    // Build the update object dynamically so we only touch fields that
    // were actually sent (e.g. a plain status change like "Done"/"Cancelled"
    // won't accidentally overwrite an existing table with `undefined`).
    const update = { status };
    if (table !== undefined) {
      update.table = table;
    }

    const reservation = await Reservation.findByIdAndUpdate(
      id,
      update,
      { new: true } // returns the document AFTER the update (Mongoose option name)
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found',
      });
    }

    res.json({
      success: true,
      reservation: {
        _id: reservation._id,
        customerName: reservation.customerName,
        phone: reservation.phone,
        date: reservation.date,
        time: reservation.time,
        guests: reservation.guests,
        table: reservation.table,   // <-- FIX: also missing from the response,
                                     //     so even a successful save wouldn't
                                     //     have been reflected without a refetch.
        notes: reservation.specialRequest,
        status: reservation.status,
      },
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


// DELETE RESERVATION
export const deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    await Reservation.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Reservation deleted",
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};