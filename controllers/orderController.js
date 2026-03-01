import Order from "../models/order.js";
import MenuItem from "../models/menuItem.js";
import InventoryItem from "../models/inventoryItem.js";
import userModel from '../models/userModel.js'
import mongoose from "mongoose";
import { io } from "../socket.js";


export const placeOrder = async (req, res) => {
  try {
    const { orderType, table, items, total } = req.body;
    const userId = req.user?._id;
    const name = req.user.name;
    const email = req.user.email;

    // 1️⃣ Validate required fields
    if (!userId || !orderType || !items || !Array.isArray(items) || !items.length || !total) {
      return res.status(400).json({ message: "Missing order information" });
    }

    // 2️⃣ Create new order
    const order = new Order({
      user: userId,
      orderType,
      table: table || "N/A",
      items,
      name,
      email,
      total,
      status: "Pending",
      statusTimestamps: { Accepted: new Date() },
      orderPlacedAt: new Date(),
      updatedAt: new Date(),
    });

    // 3️⃣ Save order
    const savedOrder = await order.save();

    // 4️⃣ Deduct inventory from recipe & increment sales
    for (const line of savedOrder.items) {
      const menuItemId = line.menuItemId || line.menuItem;
      if (!menuItemId) continue;
      const menuItem = await MenuItem.findById(menuItemId).lean();
      if (!menuItem) continue;
      const qty = Number(line.quantity) || 1;
      // Increment sales
      await MenuItem.findByIdAndUpdate(menuItemId, { $inc: { sales: qty } });
      // Deduct inventory from recipe
      const recipe = menuItem.recipe || [];
      for (const r of recipe) {
        const invId = r.inventoryItemId;
        const perServing = Number(r.quantityPerServing) || 0;
        if (!invId || perServing <= 0) continue;
        const inv = await InventoryItem.findById(invId);
        if (!inv) continue;
        const deduct = perServing * qty;
        const newQty = Math.max(0, (inv.currentQty || 0) - deduct);
        await InventoryItem.findByIdAndUpdate(invId, { currentQty: newQty });
      }
    }
    if (req.io) {
      req.io.emit("inventory:refresh");
      req.io.emit("menu:refresh");
    }

    // 5️⃣ Respond
    res.status(201).json(savedOrder);

  } catch (err) {
    console.error("Error creating order:", err.message);
    res.status(500).json({ message: "Server error: " + err.message });
  }
};

// Optional: Get orders for logged-in user
export const getOrderById = async (req, res) => {
  try {

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id
    }).lean();

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      order: {
        ...order,
        _id: order._id.toString(),
        user: order.user.toString(),
      }
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: "Server error",
    });

  }
};

// Get All Orders (Admin)
// Get all orders
export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email admin") // populate customer name
      .sort({ createdAt: 1 });

    const formatted = orders.map(o => ({
      id: o._id,
      customer: o.user ? o.user.name : "Unknown", // user may be null
      orderType: o.orderType,
      table: o.table || "N/A",
      items: Array.isArray(o.items)
        ? o.items.map(i => `${i.title || 'Item'} x${i.quantity || 1}`).join(", ")
        : '-', // fallback if items missing
      total: o.total,
      status: o.status,
      statusTimestamps: o.statusTimestamps,
      orderPlacedAt: o.orderPlacedAt,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// Advance order status
export const advanceOrderStatus = async (req, res) => {
  try {

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID required",
      });
    }

    // get order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log("Current:", order.status);

    // get next status from schema method
    const nextStatus = order.advanceStatus();

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: "Cannot advance status further",
      });
    }

    // ✅ update ONLY required fields (NO full validation)
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: order.status,
        statusTimestamps: order.statusTimestamps,
        updatedAt: new Date(),
      },
      { new: true }
    );

    // socket emit
    if (req.io) {
      req.io.emit("orderStatusUpdated", {
        id: updatedOrder._id.toString(),
        status: updatedOrder.status,
        statusTimestamps: updatedOrder.statusTimestamps,
      });
    }

    res.status(200).json({
      success: true,
      _id: updatedOrder._id.toString(),
      status: updatedOrder.status,
      statusTimestamps: updatedOrder.statusTimestamps,
      updatedAt: updatedOrder.updatedAt,
    });

  } catch (error) {

    console.error("Advance status error:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });

  }
};


export const updateOrder = async (req, res) => {
  try {
    const { table, items, total, status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update basic fields
    if (table) order.table = table;
    if (items) order.items = items;
    if (total) order.total = total;

    // ✅ If status is being updated manually
    if (status && status !== order.status) {
      order.status = status;

      // Update timestamp for that status
      if (!order.statusTimestamps) {
        order.statusTimestamps = {};
      }

      order.statusTimestamps[status] = new Date();
      order.updatedAt = new Date();
    }

    await order.save();

    res.json({
      message: "Order updated successfully",
      order,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order" });
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
// export const updateOrderStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;

//     const order = await Order.findById(id);
//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Optional: validate status transitions based on orderType
//     if (order.orderType === "Delivery" && !["Out for Delivery", "Delivered"].includes(status)) {
//       return res.status(400).json({ message: "Invalid status for Delivery" });
//     }
//     if (order.orderType === "Takeaway" && status !== "Ready for Pickup") {
//       return res.status(400).json({ message: "Invalid status for Takeaway" });
//     }

//     order.status = status;
//     await order.save();
//     res.json(order);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message });
//   }
// };


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




// Cancel order
// controllers/orderController.js
export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    const orderUserId = order.user?._id?.toString() || order.user?.toString();

    if (orderUserId && orderUserId !== req.user.id && !req.user.admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status === "Delivered")
      return res.status(400).json({ message: "Cannot cancel delivered order" });

    order.status = "Cancelled";
    order.statusTimestamps = order.statusTimestamps || {};
    order.statusTimestamps.Cancelled = new Date();

    await order.save({ validateBeforeSave: false });

    res.json({ success: true, order });
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