import Order from "../models/Order.js";
import Cart from "../models/Cart.js";

// Create order (checkout)
export const createOrder = async (req, res) => {
  try {
    const { address, paymentMethod, shippingFee } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart || cart.items.length === 0)
      return res.status(400).json({ error: "Cart is empty" });

    const subtotal = cart.totalPrice;
    const total = subtotal + (shippingFee || 0);

    const order = new Order({
      user: req.user.id,
      items: cart.items,
      shippingAddress: address,
      paymentMethod,
      subtotal,
      shippingFee: shippingFee || 0,
      total,
    });

    await order.save();

    // Clear cart after successful order
    cart.items = [];
    cart.totalPrice = 0;
    cart.totalQuantity = 0;
    await cart.save();

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get logged-in user orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort("-createdAt");

    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("items.product");

    if (!order) return res.status(404).json({ error: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin - update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });

    order.orderStatus = status;
    await order.save();

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
