import mongoose from "mongoose";

// Schema for a single menu item
const menuItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  available: { type: Boolean, default: true }
});

// Main Menu schema with 3 categories
const menuSchema = new mongoose.Schema({
  coffee: [menuItemSchema],
  matcha: [menuItemSchema],
  food: [menuItemSchema]
}, { timestamps: true });

export default mongoose.model("Menu", menuSchema);