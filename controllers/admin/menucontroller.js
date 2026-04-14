// controllers/menuController.js
import MenuItem from "../../models/menuItem.js";
import NodeCache from "node-cache";

// ✅ FIX: Instantiate cache (was referenced but never created)
const menuCache = new NodeCache({ stdTTL: 60 }); // 60s TTL

const MENU_SELECT =
  "title category price description imageUrl allergens kcal available stock sales recipe";

// ── GET /menu/user — public facing (fast, cached) ─────────────────────────
export const getMenuUser = async (req, res) => {
  try {
    const CACHE_KEY = "menu_user_public";

    const cached = menuCache.get(CACHE_KEY);
    if (cached) {
      return res.json(cached); // ✅ ~1ms cached response
    }

    const menu = await MenuItem.find({ available: true })
      .select(
        "title description price imageUrl available category allergens kcal"
      )
      .lean()
      .sort({ createdAt: -1 })
      .limit(500);

    // ✅ FIX: Actually store result in cache (was missing)
    menuCache.set(CACHE_KEY, menu);

    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /menu/admin — admin facing (no cache, includes unavailable) ────────
export const getMenuAdmin = async (req, res) => {
  try {
    const menu = await MenuItem.find()
      .select(MENU_SELECT)
      .lean()
      .sort({ createdAt: -1 });
    res.json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /menu — add item ─────────────────────────────────────────────────
export const addMenuItem = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      imageUrl,
      available,
      category,
      allergens,
      kcal,
      recipe,
    } = req.body;

    if (!title || !price || !category)
      return res
        .status(400)
        .json({ message: "Title, price and category required" });

    const newItem = await MenuItem.create({
      title,
      description,
      price,
      imageUrl,
      available: available ?? true,
      category,
      allergens,
      kcal,
      sales: 0,
      stock: true,
      recipe: Array.isArray(recipe) ? recipe : [],
    });

    // ✅ Invalidate cache so next fetch reflects new item
    menuCache.del("menu_user_public");

    if (req.io) req.io.emit("menu:refresh");
    res.status(201).json(newItem);
  } catch (err) {
    console.error("ADD MENU ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /menu/:itemId — update item ──────────────────────────────────────
export const updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const updatedItem = await MenuItem.findByIdAndUpdate(itemId, req.body, {
      new: true,
      runValidators: true,
      lean: true,
    });

    if (!updatedItem)
      return res.status(404).json({ message: "Item not found" });

    // ✅ Invalidate cache on update
    menuCache.del("menu_user_public");

    if (req.io) req.io.emit("menu:refresh");
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /menu/:itemId — delete item ───────────────────────────────────
export const deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const item = await MenuItem.findByIdAndDelete(itemId);

    if (!item) return res.status(404).json({ message: "Item not found" });

    // ✅ Invalidate cache on delete
    menuCache.del("menu_user_public");

    if (req.io) req.io.emit("menu:refresh");
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PATCH /menu/:id/availability — toggle availability ───────────────────
export const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);
    if (!menuItem)
      return res.status(404).json({ message: "Menu item not found" });

    menuItem.available = !menuItem.available;
    menuItem.stock = menuItem.available;
    await menuItem.save();

    // ✅ Invalidate cache on availability change
    menuCache.del("menu_user_public");

    if (req.io) req.io.emit("menu:refresh");
    res.json({ available: menuItem.available, stock: menuItem.stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};