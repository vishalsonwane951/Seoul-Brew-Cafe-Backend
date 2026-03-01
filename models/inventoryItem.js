import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    icon: { type: String, default: "📦" },
    category: {
      type: String,
      enum: ["coffee", "food"],
      default: "coffee",
    },
    currentQty: { type: Number, required: true, default: 0 },
    unit: { type: String, required: true }, // kg, L, pcs, etc.
    minQty: { type: Number, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryItem", inventoryItemSchema);
