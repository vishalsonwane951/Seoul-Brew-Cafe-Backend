import mongoose from "mongoose";

const reservationSchema = mongoose.Schema(
  {
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    table :{},
    guests: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined"],
      default: "Pending",
    },
    specialRequest: { type: String }, 
  },
  { timestamps: true }
);

export default mongoose.model("Reservation", reservationSchema);