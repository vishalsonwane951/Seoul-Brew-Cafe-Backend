import mongoose from "mongoose";

const STATUS_FLOW = {
  "Dine-In": ["Pending","Accepted", "Preparing","Ready", "Served"],
  "Takeaway": ["Pending","Accepted", "Preparing", "Ready", "Picked Up"],
  "Delivery": ["Pending","Accepted", "Preparing", "Ready", "Out for Delivery", "Delivered"],
};

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },

    /* ✅ ADD CUSTOMER INFO */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    orderType: {
      type: String,
      enum: ["Dine-In", "Takeaway", "Delivery"],
      required: true,
    },

    table: {
      type: String,
      default: "N/A",
    },

    items: [
      {
        menuItemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "MenuItem",
        },
        title: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "Preparing",
        "Served",
        "Ready",
        "Picked Up",
        "Out for Delivery",
        "Delivered",
        "Cancelled",
      ],
      default: "Accepted",
    },

    statusTimestamps: {
      Accepted: { type: Date, default: () => new Date() },
      Preparing: { type: Date, default: null },
      Served: { type: Date, default: null },
      Ready: { type: Date, default: null },
      "Picked Up": { type: Date, default: null },
      "Out for Delivery": { type: Date, default: null },
      Delivered: { type: Date, default: null },
      Cancelled: { type: Date, default: null },
    },

    orderPlacedAt: {
      type: Date,
      default: () => new Date(),
    },

    updatedAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  { timestamps: true }
);


/* Advance status safely */
orderSchema.methods.advanceStatus = function () {

  if (this.status === "Cancelled") return null;

  const flow = STATUS_FLOW[this.orderType];

  if (!flow) return null;

  const currentIndex = flow.indexOf(this.status);

  if (currentIndex < 0 || currentIndex >= flow.length - 1)
    return null;

  const nextStatus = flow[currentIndex + 1];

  this.status = nextStatus;

  this.statusTimestamps[nextStatus] = new Date();

  this.updatedAt = new Date();

  return this.status;
};

export default mongoose.model("Order", orderSchema);