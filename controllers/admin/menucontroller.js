import MenuItem from "../../models/menuItem.js";

// // GET all menu items (flattened)
// export const getMenu = async (req, res) => {
//   try {
//     const menu = await Menu.findOne();
//     if (!menu) return res.json([]);

//     const result = [];
//     ["coffee", "matcha", "food"].forEach(cat => {
//       menu[cat].forEach(item => {
//         result.push({
//           id: item._id,
//           category: cat,
//           title: item.title,
//           description: item.description,
//           price: item.price,
//           imageUrl: item.imageUrl,
//           available: item.available
//         });
//       });
//     });

//     res.json(result);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// POST add item
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
      kcal
    } = req.body;

    // validation
    if (!title || !price || !category) {
      return res.status(400).json({
        message: "Title, price and category required"
      });
    }

    const { recipe } = req.body;
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

    if (req.io) req.io.emit("menu:refresh");
    res.status(201).json(newItem);

  } catch (err) {
    console.error("ADD MENU ERROR:", err);
    res.status(500).json({
      message: err.message
    });
  }
};

// PUT update item
export const updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const updatedItem = await MenuItem.findByIdAndUpdate(
      itemId,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedItem)
      return res.status(404).json({ message: "Item not found" });
    if (req.io) req.io.emit("menu:refresh");

    res.json(updatedItem);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE item
export const deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await MenuItem.findByIdAndDelete(itemId);

    if (!item)
      return res.status(404).json({ message: "Item not found" });
    if (req.io) req.io.emit("menu:refresh");

    res.json({ message: "Item deleted" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH toggle availability
export const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    menuItem.available = !menuItem.available;
    menuItem.stock = menuItem.available;
    await menuItem.save();
    if (req.io) req.io.emit("menu:refresh");

    res.json({ available: menuItem.available, stock: menuItem.stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};