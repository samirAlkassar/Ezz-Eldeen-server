import express from "express";
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getUserOrders);
router.get("/:id", verifyToken, getOrderById);

// Admin only
// router.put("/:id/status", verifyToken, verifyAdmin, updateOrderStatus);

export default router;
