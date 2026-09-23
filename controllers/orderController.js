import Order from "../models/order.js";
import MenuItem from "../models/menuItem.js";
import InventoryItem from "../models/inventoryItem.js";
import userModel from "../models/userModel.js";
import mongoose from "mongoose";
import { getIO } from "../socket.js";
import User from "../models/userModel.js";

console.log("✅ orderController.js loaded from:", import.meta.url);

// Shared formatter so REST (getOrders) and socket emits (order:new / order:updated /
// order:cancelled) always send the exact same shape to the frontend.
const formatOrder = (o) => ({
  id: o._id.toString(),
  _id: o._id.toString(), // kept for compatibility with code that still reads _id
  customer: o.user?.name || o.name || "Unknown",
  orderType: o.orderType,
  table: o.table || "N/A",
  items: Array.isArray(o.items)
    ? o.items
        .map((i) => `${i.title || "Item"} x${i.quantity || 1}`)
        .join(", ")
    : "-",
  total: o.total,
  status: o.status,
  statusTimestamps: o.statusTimestamps,
  orderPlacedAt: o.orderPlacedAt,
  updatedAt: o.updatedAt,
});

// Prefer req.io (attached by socket middleware) but fall back to getIO()
// so events still fire even if that middleware isn't wired up on a route.
const emitEvent = (req, event, payload) => {
  const io = req.io || getIO();
  if (io) io.emit(event, payload);
};

export const placeOrder = async (req, res) => {


  try {
    const { orderType, table, items, total } = req.body;

    const userId = req.user?._id || req.body.user;

    if (!userId) {
      return res.status(400).json({ message: "Missing user information" });
    }

    let name = req.user?.name;
    let email = req.user?.email;

    if (!name || !email) {
      const userDoc = await User.findById(userId).lean();
      if (!userDoc) {
        return res.status(400).json({ message: "User not found" });
      }
      name = name || userDoc.name;
      email = email || userDoc.email;
    }

    if (
      !orderType ||
      !items ||
      !Array.isArray(items) ||
      !items.length ||
      !total
    ) {
      return res.status(400).json({
        message: "Missing order information",
      });
    }

    const order = new Order({
      user: userId,
      name,
      email,
      orderType,
      table: table || "N/A",
      items,
      total,
      status: "Pending",
      statusTimestamps: { Pending: new Date() },
      orderPlacedAt: new Date(),
      updatedAt: new Date(),
    });

    const savedOrder = await order.save();

    for (const line of savedOrder.items) {
      const menuItemId = line.menuItemId || line.menuItem;
      if (!menuItemId) continue;

      const menuItem = await MenuItem.findById(menuItemId).lean();
      if (!menuItem) continue;

      const qty = Number(line.quantity) || 1;

      await MenuItem.findByIdAndUpdate(menuItemId, {
        $inc: { sales: qty },
      });

      const recipe = menuItem.recipe || [];

      for (const r of recipe) {
        const invId = r.inventoryItemId;
        const perServing = Number(r.quantityPerServing) || 0;

        if (!invId || perServing <= 0) continue;

        const inv = await InventoryItem.findById(invId);
        if (!inv) continue;

        const deduct = perServing * qty;
        const newQty = Math.max(0, (inv.currentQty || 0) - deduct);

        await InventoryItem.findByIdAndUpdate(invId, {
          currentQty: newQty,
        });
      }
    }

    // Populate the user so the formatted payload has a customer name, then
    // broadcast the new order to every connected admin dashboard in real time.
    const populatedOrder = await savedOrder.populate("user", "name email admin");
    emitEvent(req, "order:new", formatOrder(populatedOrder));

    emitEvent(req, "inventory:refresh");
    emitEvent(req, "menu:refresh");

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({
      message: "Server error: " + err.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
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
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      orders: orders.map((o) => ({
        ...o,
        _id: o._id.toString(),
        user: o.user ? o.user.toString() : null,
      })),
    });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email admin")
      .sort({ createdAt: -1 }); // -1 = newest first, 1 = oldest first

    const formatted = orders.map(formatOrder);

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const advanceOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status: targetStatus } = req.body;

    console.log("🔥 advanceOrderStatus HIT | id:", id, "| body:", req.body);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Order ID required",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    console.log(
      "Current:", order.status,
      "| Type:", order.orderType,
      "| Target:", targetStatus
    );

    const result = order.advanceStatus(targetStatus);

    console.log("advanceStatus() result:", result);

    if (result.error) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: result.status,
        statusTimestamps: order.statusTimestamps,
        updatedAt: new Date(),
      },
      { new: true }
    ).populate("user", "name email admin");

    // Broadcast to all connected clients so every dashboard updates live,
    // matching the same shape getOrders/order:new already use.
    emitEvent(req, "order:updated", formatOrder(updatedOrder));

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

    if (table) order.table = table;
    if (items) order.items = items;
    if (total) order.total = total;

    if (status && status !== order.status) {
      order.status = status;

      if (!order.statusTimestamps) {
        order.statusTimestamps = {};
      }

      order.statusTimestamps[status] = new Date();
      order.updatedAt = new Date();
    }

    await order.save();

    const populatedOrder = await order.populate("user", "name email admin");
    emitEvent(req, "order:updated", formatOrder(populatedOrder));

    res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order" });
  }
};

export const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const orderUserId = order.user?._id?.toString() || order.user?.toString();
    if (
      req.user &&
      orderUserId !== req.user._id?.toString() &&
      !req.user.admin
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (
      order.orderType === "Delivery" &&
      !["Out for Delivery", "Delivered"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status for Delivery" });
    }
    if (order.orderType === "Takeaway" && status !== "Ready for Pickup") {
      return res.status(400).json({ message: "Invalid status for Takeaway" });
    }

    order.status = status;
    await order.save();

    const populatedOrder = await order.populate("user", "name email admin");
    emitEvent(req, "order:updated", formatOrder(populatedOrder));

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    const orderUserId = order.user?._id?.toString() || order.user?.toString();

    if (orderUserId && orderUserId !== req.user.id && !req.user.admin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (
      ["Served", "Picked Up", "Delivered", "Payment Done"].includes(order.status)
    ) {
      return res.status(400).json({
        message: `Cannot cancel an order that is already ${order.status}`,
      });
    }

    order.status = "Cancelled";
    order.statusTimestamps = order.statusTimestamps || {};
    order.statusTimestamps.Cancelled = new Date();

    await order.save({ validateBeforeSave: false });

    const populatedOrder = await order.populate("user", "name email admin");
    emitEvent(req, "order:cancelled", formatOrder(populatedOrder));

    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};