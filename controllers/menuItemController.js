// controllers/menuController.js
import Menu from "../models/menuItem.js";
import MenuItem from "../models/menuItem.js";
import InventoryItem from "../models/inventoryItem.js";

// GET /api/menu – returns all items with inStockFromRecipe when recipe exists
export const getMenu = async (req, res) => {
  try {
    const items = await MenuItem.find({}).lean();
    const ingredientIds = [...new Set(items.flatMap((m) => (m.recipe || []).map((r) => r.inventoryItemId?.toString()).filter(Boolean)))];
    const inventoryMap = {};
    if (ingredientIds.length > 0) {
      const invItems = await InventoryItem.find({ _id: { $in: ingredientIds } }).lean();
      invItems.forEach((inv) => {
        inventoryMap[inv._id.toString()] = inv;
      });
    }
    const result = items.map((item) => {
      const recipe = item.recipe || [];
      let inStockFromRecipe = null;
      if (recipe.length > 0) {
        inStockFromRecipe = recipe.every((r) => {
          const inv = inventoryMap[r.inventoryItemId?.toString()];
          return inv && inv.currentQty >= (r.quantityPerServing || 0);
        });
      }
      return {
        ...item,
        inStockFromRecipe,
        // effective stock: manual stock AND (no recipe or recipe in stock)
        stock: item.stock && (inStockFromRecipe === null || inStockFromRecipe),
      };
    });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// POST /api/menu/add-item
export const createMenu = async (req, res) => {
  try {
    const { category, title, description, price, imageUrl, available, allergens, kcal } = req.body;

    if (!category || !title || !price) {
      return res.status(400).json({ message: "Category, title, and price are required" });
    }

    // Create a new menu item
    const newItem = new MenuItem({
      category,
      title,
      description: description || "",
      price,
      stock,
      imageUrl: imageUrl || "☕",
      available: available !== undefined ? available : true,
      allergens: allergens || "",
      kcal: kcal || 0,
      sales: 0
    });

    await newItem.save();

    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
};

// POST /api/menu/init
export const initMenu = async (req, res) => {
  try {
    const existing = await Menu.findOne();
    if (existing) {
      return res.status(400).json({ message: "Menu already exists" });
    }

    const menu = new Menu({
      coffee: [],
      matcha: [],
      food: []
    });

    await menu.save();
    res.status(201).json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
