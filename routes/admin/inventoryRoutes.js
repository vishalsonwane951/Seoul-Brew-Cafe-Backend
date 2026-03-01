import express from "express";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  updateStock,
  deleteInventoryItem,
  getSupplierOrders,
  createSupplierOrder,
  updateSupplierOrder,
} from "../../controllers/admin/inventoryController.js";
import { protect, admin } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, admin, getInventory);
router.post("/", protect, admin, createInventoryItem);
router.put("/:id", protect, admin, updateInventoryItem);
router.patch("/:id/stock", protect, admin, updateStock);
router.delete("/:id", protect, admin, deleteInventoryItem);

router.get("/orders", protect, admin, getSupplierOrders);
router.post("/orders", protect, admin, createSupplierOrder);
router.put("/orders/:id", protect, admin, updateSupplierOrder);

export default router;
