import mongoose from "mongoose";

const supplierOrderSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    supplier: { type: String, required: true },
    items: { type: String, required: true },
    total: { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "In Transit", "Delivered"],
      default: "Pending",
    },
    deliveryDate: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("SupplierOrder", supplierOrderSchema);
