// controllers/menuController.js
import Menu from "../models/menuItem.js";

// GET /api/menu
export const getMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne({},{coffee: 1, matcha: 1, food: 1,_id: 0}); // single document
    if (!menu) return res.status(404).json({ message: "Menu not found" });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/menu/add-item
export const createMenu = async (req, res) => {
  try {
    const { category, title, description, price, imageUrl, available } = req.body;
    const menu = await Menu.findOne();
    if (!menu) return res.status(404).json({ message: "Menu not found" });

    menu[category].push({ title, description, price, imageUrl, available });
    await menu.save();
    res.status(201).json(menu);
  } catch (err) {
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
