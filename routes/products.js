import express from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  addReview,
  getRelatedProducts,
  getReviews
} from "../controllers/products.js";

import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// CREATE
router.post("/", verifyToken, createProduct);

// READ
router.get("/", getProducts);

// GET RELATED PRODUCTS
router.get("/related", getRelatedProducts);
router.get("/:slug", getProductBySlug);

// UPDATE
router.patch("/:id", verifyToken, updateProduct);

// DELETE
router.delete("/:id", verifyToken, deleteProduct);

// GET REVIEWS
router.get("/reviews/:id", getReviews);

// ADD REVIEW
router.post("/:id/review", verifyToken, addReview);

export default router;
