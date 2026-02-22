
// Create Order
// controllers/orderController.js
import Order from "../models/order.js";

export const placeOrder = async (req, res) => {
  try {
    // user is available from protect middleware
    const userId = req.user._id;

    const { customerName, email, items, totalAmount, orderType } = req.body;

    let status = "Pending";

    if (orderType === "Delivery") {
      status = "Pending"; // Admin updates to "Out for Delivery"
    } else if (orderType === "Takeaway") {
      status = "Pending"; // Admin updates to "Ready for Pickup"
    } else {
      status = "Pending"; // Dine-In
    }

    const order = new Order({
      user: req.user._id, // link order to logged-in user
      customerName,
      email,
      items,
      totalAmount,
      orderType,
      status,
    });

    await order.save();

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Get All Orders (Admin)
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Order Status
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Optional: validate status transitions based on orderType
    if (order.orderType === "Delivery" && !["Out for Delivery", "Delivered"].includes(status)) {
      return res.status(400).json({ message: "Invalid status for Delivery" });
    }
    if (order.orderType === "Takeaway" && status !== "Ready for Pickup") {
      return res.status(400).json({ message: "Invalid status for Takeaway" });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// get order by useid
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("items.menuItemId");

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};