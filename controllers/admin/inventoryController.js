import InventoryItem from "../../models/inventoryItem.js";
import SupplierOrder from "../../models/supplierOrder.js";

const getStatus = (pct) => {
  if (pct >= 70) return "good";
  if (pct >= 30) return "warn";
  if (pct > 0) return "low";
  return "out";
};

const toInventoryView = (item) => {
  const minQty = item.minQty || 1;
  const pct = minQty > 0 ? Math.min(100, Math.round((item.currentQty / minQty) * 100)) : 0;
  const status = getStatus(pct);
  const detail = `${item.currentQty}${item.unit} / Min ${item.minQty}${item.unit}`;
  return {
    _id: item._id,
    name: item.name,
    icon: item.icon,
    category: item.category,
    detail,
    currentQty: item.currentQty,
    unit: item.unit,
    minQty: item.minQty,
    pct,
    status,
  };
};

// GET /api/inventory
export const getInventory = async (req, res) => {
  try {
    const items = await InventoryItem.find().sort({ category: 1, name: 1 });
    res.json(items.map(toInventoryView));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/inventory
export const createInventoryItem = async (req, res) => {
  try {
    const { name, icon, category, currentQty, unit, minQty } = req.body;
    if (!name || unit === undefined || minQty === undefined) {
      return res.status(400).json({ message: "Name, unit and minQty are required" });
    }
    const item = await InventoryItem.create({
      name,
      icon: icon || "📦",
      category: category || "coffee",
      currentQty: currentQty ?? 0,
      unit,
      minQty,
    });
    const view = toInventoryView(item);
    if (req.io) req.io.emit("inventory:refresh");
    res.status(201).json(view);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/inventory/:id
export const updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    const { name, icon, category, currentQty, unit, minQty } = req.body;
    if (name !== undefined) item.name = name;
    if (icon !== undefined) item.icon = icon;
    if (category !== undefined) item.category = category;
    if (currentQty !== undefined) item.currentQty = currentQty;
    if (unit !== undefined) item.unit = unit;
    if (minQty !== undefined) item.minQty = minQty;
    await item.save();
    const view = toInventoryView(item);
    if (req.io) req.io.emit("inventory:refresh");
    res.json(view);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/inventory/:id/stock
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentQty } = req.body;
    const item = await InventoryItem.findById(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    item.currentQty = currentQty ?? item.currentQty;
    await item.save();
    const view = toInventoryView(item);
    if (req.io) req.io.emit("inventory:refresh");
    res.json(view);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/inventory/:id
export const deleteInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await InventoryItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (req.io) req.io.emit("inventory:refresh");
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/inventory/orders
export const getSupplierOrders = async (req, res) => {
  try {
    const orders = await SupplierOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/inventory/orders
export const createSupplierOrder = async (req, res) => {
  try {
    const { date, supplier, items, total, status, deliveryDate } = req.body;
    if (!supplier || !items || !total) {
      return res.status(400).json({ message: "Supplier, items and total are required" });
    }
    const order = await SupplierOrder.create({
      date: date || new Date().toISOString().slice(0, 10),
      supplier,
      items,
      total,
      status: status || "Pending",
      deliveryDate,
    });
    if (req.io) req.io.emit("supplierOrders:refresh");
    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/inventory/orders/:id
export const updateSupplierOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await SupplierOrder.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (req.io) req.io.emit("supplierOrders:refresh");
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
