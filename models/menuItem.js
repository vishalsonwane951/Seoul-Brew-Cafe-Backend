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
  stock: { type: Boolean, default: true }, // manual override; when recipe exists, also consider inStockFromRecipe
  // Link to inventory: deduct quantityPerServing * orderQty when order is placed
  recipe: [
    {
      inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'InventoryItem' },
      quantityPerServing: { type: Number, required: true, min: 0 },
    },
  ],
}, { timestamps: true });

export default mongoose.model("MenuItem", menuItemSchema);