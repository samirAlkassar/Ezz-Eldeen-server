import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cart.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken(), getCart);
router.post("/add", verifyToken(), addToCart);
router.put("/update", verifyToken(), updateCartItem);
router.delete("/remove/:productId", verifyToken(), removeFromCart);
router.delete("/clear", verifyToken(), clearCart);

export default router;
