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
      const { status } = req.body;

     const reservation = await Reservation.findByIdAndUpdate(
  id,
  { status },
  { returnDocument: 'after' } // <- updated option
);
      res.json({
        success: true,
        reservation: {
          _id: reservation._id,
          name: reservation.customerName,
          phone: reservation.phone,
          date: reservation.date,
          time: reservation.time,
          guests: reservation.guests,
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