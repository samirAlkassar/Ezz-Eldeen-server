import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// ======================
// Get wishlist for user
// ======================
export const getWishlist = async (req, res) => {
  try {
    const userId = req.user.id;

    const wishlist = await Wishlist.findOne({ user: userId }).populate("items");

    if (!wishlist) {
      return res.status(200).json({ items: [] });
    }

    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Error getting wishlist", error });
  }
};

// ======================
// Add item to wishlist
// ======================
export const addToWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // ✔ Check product exists
    const productExists = await Product.findById(productId);
    if (!productExists) {
      return res.status(404).json({ message: "Product not found" });
    }

    let wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: userId, items: [productId] });
      return res.status(201).json(wishlist);
    }

    // ✔ Prevent duplicates
    if (wishlist.items.includes(productId)) {
      return res.status(400).json({ message: "Product already in wishlist" });
    }

    wishlist.items.push(productId);
    await wishlist.save();

    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Error adding to wishlist", error });
  }
};

// ======================
// Remove item from wishlist
// ======================
export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ user: userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    };

    if (!wishlist.items.includes(productId)) {
      return res.status(400).json({ message: "Product already deleted" });
    }

    wishlist.items = wishlist.items.filter(
      (item) => item.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json(wishlist);
  } catch (error) {
    res.status(500).json({ message: "Error removing item", error });
  }
};
