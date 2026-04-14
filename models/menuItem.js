import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String },
  price:       { type: Number, required: true },
  imageUrl:    { type: String },
  available:   { type: Boolean, default: true },
  category:    { type: String, required: true },
  sales:       { type: Number, default: 0 },
  allergens:   { type: String, default: "" },
  kcal:        { type: Number, default: 0 },
  stock:       { type: Boolean, default: true },
  recipe: [
    {
      inventoryItemId:    { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
      quantityPerServing: { type: Number, required: true, min: 0 },
    },
  ],
}, { timestamps: true });

// ✅ Single compound index covers filter + sort in one shot
menuItemSchema.index({ available: 1, createdAt: -1 });

// ✅ Keep category index for other filtered queries
menuItemSchema.index({ category: 1, available: 1 });

export default mongoose.model("MenuItem", menuItemSchema);