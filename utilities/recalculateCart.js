import Cart from "../models/Cart.js";
import Product from "../models/Product.js";

export const recalculateCart = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) return;

  const carts = await Cart.find({ "items.product": productId });

  for (const cart of carts) {
    cart.items.forEach(item => {
      if (item.product.toString() === productId) {
        item.priceAtTime = product.discountPrice || product.price;
      }
    });

    // Recalculate totals
    let totalQuantity = 0;
    let totalPrice = 0;

    cart.items.forEach(item => {
      totalQuantity += item.quantity;
      totalPrice += item.quantity * item.priceAtTime;
    });

    cart.totalQuantity = totalQuantity;
    cart.totalPrice = totalPrice;

    await cart.save();
  }
};
