
// Create Order
// controllers/orderController.js
import Order from "../models/order.js";

export const placeOrder = async (req, res) => {
  try {
    const { customerName, email, items, totalAmount, orderType } = req.body;

    // 1️⃣ Validate required fields
    if (!customerName || !email || !items || !Array.isArray(items) || !items.length || !totalAmount || !orderType) {
      return res.status(400).json({ message: "Missing order information" });
    }

    // 2️⃣ Set default status
    let status = "Pending"; // all orders start pending

    // 3️⃣ Create order (no user ID needed)
    const order = new Order({
      customerName,
      email,
      items,
      totalAmount,
      orderType,
      status,
    });

    // 4️⃣ Save order
    const savedOrder = await order.save();

    // 5️⃣ Respond with saved order
    res.status(201).json(savedOrder);

  } catch (err) {
    console.error("Error creating order:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Optional: Get orders for logged-in user
export const getMyOrders = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);

  } catch (err) {
    console.error("Error fetching orders:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
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
// export const getMyOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({ user: req.user._id })
//       .populate("items.menuItemId");

//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };