import mongoose from "mongoose";

const reservationSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    table :{},
    guests: { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Declined", "Cancelled"],
      default: "Pending",
    },
    specialRequest: { type: String }, 
  },
  { timestamps: true }
);
reservationSchema.index({ createdAt: -1 });
reservationSchema.index({ user: 1, createdAt: -1 });
export default mongoose.model("Reservation", reservationSchema);