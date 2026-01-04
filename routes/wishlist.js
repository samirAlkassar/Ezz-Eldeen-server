import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} from "../controllers/wishlist.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", verifyToken, getWishlist);
router.post("/add", verifyToken, addToWishlist);
router.delete("/remove", verifyToken, removeFromWishlist);

export default router;
