import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { localizeProduct } from "../utilities/localizeProduct.js";

// Get user cart
export const getCart = async (req, res) => {
  try {
    const lang = req.lang;
    let cart = await Cart.findOne({ user: req.user.id }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    const localizedItems = cart.items.map(item => ({
      ...item.toObject(),
      product: item.product
        ? localizeProduct(item.product, lang)
        : null,
    }));

    res.status(200).json({...cart.toObject(),items: localizedItems,});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: "Product not found" });

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        user: req.user.id,
        items: [{ product: productId, quantity, priceAtTime: product.price }],
      });
    } else {
      const existingItem = cart.items.find(
        (item) => item.product.toString() === productId
      );

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({
          product: productId,
          quantity,
          priceAtTime: product.price,
        });
      }
    }

    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtTime,
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    console.error("Add to Cart Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === productId);
    if (!item) return res.status(404).json({ error: "Item not found" });

    item.quantity = quantity;

    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtTime,
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    cart.totalQuantity = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.totalPrice = cart.items.reduce(
      (sum, item) => sum + item.quantity * item.priceAtTime,
      0
    );

    await cart.save();
    res.status(200).json(cart);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) return res.status(404).json({ error: "Cart not found" });

    cart.items = [];
    cart.totalPrice = 0;
    cart.totalQuantity = 0;

    await cart.save();
    res.status(200).json({ message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
