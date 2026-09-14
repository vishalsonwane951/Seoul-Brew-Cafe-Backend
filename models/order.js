import mongoose from "mongoose";

const STATUS_FLOW = {
  "Dine-In": ["Pending", "Accepted", "Preparing", "Ready", "Served", "Payment Done"],
  "Takeaway": ["Pending", "Accepted", "Preparing", "Ready", "Picked Up", "Payment Done"],
  "Delivery": ["Pending", "Accepted", "Preparing", "Ready", "Out for Delivery", "Delivered", "Payment Done"],
};

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "userModel",
      required: true,
    },

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
        "Payment Done",
        "Cancelled",
      ],
      default: "Pending",
    },

    statusTimestamps: {
      Pending: { type: Date, default: () => new Date() },
      Accepted: { type: Date, default: null },
      Preparing: { type: Date, default: null },
      Ready: { type: Date, default: null },
      Served: { type: Date, default: null },
      "Picked Up": { type: Date, default: null },
      "Out for Delivery": { type: Date, default: null },
      Delivered: { type: Date, default: null },
      "Payment Done": { type: Date, default: null },
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

/**
 * Advance status safely.
 * If targetStatus is provided, it must match the expected next step.
 * Returns { status: <newStatus> } on success, or { error: <reason> } on failure.
 */
orderSchema.methods.advanceStatus = function (targetStatus) {
  if (this.status === "Cancelled") {
    return { error: "Order is cancelled and cannot be advanced" };
  }

  const flow = STATUS_FLOW[this.orderType];
  if (!flow) {
    return { error: `Unknown orderType "${this.orderType}"` };
  }

  const currentIndex = flow.indexOf(this.status);

  if (currentIndex < 0) {
    return {
      error: `Status "${this.status}" is not part of the ${this.orderType} flow`,
    };
  }

  if (currentIndex >= flow.length - 1) {
    return { error: `Order already at final status "${this.status}"` };
  }

  const expectedNext = flow[currentIndex + 1];

  if (targetStatus && targetStatus !== expectedNext) {
    return {
      error: `Invalid transition: expected "${expectedNext}" but received "${targetStatus}"`,
    };
  }

  this.status = expectedNext;
  this.statusTimestamps[expectedNext] = new Date();
  this.updatedAt = new Date();

  return { status: expectedNext };
};

console.log("✅ order.js model loaded from:", import.meta.url);

export default mongoose.model("Order", orderSchema);