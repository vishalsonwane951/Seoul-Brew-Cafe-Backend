import mongoose from "mongoose";

const orderSchema = mongoose.Schema(
  {
    // 🔗 Link order to logged-in user
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerName: { type: String, required: true },
    email: { type: String, required: true },

    orderType: { 
      type: String, 
      enum: ["Dine-In", "Takeaway", "Delivery"], 
      required: true 
    },

    items: [
      {
        menuItemId: { 
          type: mongoose.Schema.Types.ObjectId, 
          ref: "MenuItem" 
        },
        title: String,
        quantity: Number,
        price: Number,
      },
    ],

    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: [
        "Pending",
        "Preparing",
        "Out for Delivery",
        "Delivered",
        "Ready for Pickup",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);