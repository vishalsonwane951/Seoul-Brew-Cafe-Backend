import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  available: { type: Boolean, default: true },
  category: { type: String, required: true }, // coffee, matcha, food, etc.
  sales: { type: Number, default: 0 },
  allergens: { type: String, default: '' },
  kcal: { type: Number, default: 0 },
  stock: { type: Boolean, default: true } // true = In Stock, false = Out of Stock
}, { timestamps: true });

export default mongoose.model("MenuItem", menuItemSchema);