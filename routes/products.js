import express from "express";
import {
  createProduct,
  getProducts,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  addReview,
  getRelatedProducts,
  getReviews,
  getProductsAdmin
} from "../controllers/products.js";

import { verifyToken } from "../middleware/auth.js";
import upload from "../middleware/multer.js";

const router = express.Router();

// CREATE
router.post("/", verifyToken("admin"), createProduct);

// READ
router.get("/", getProducts);
router.get("/admin", verifyToken("admin"), getProductsAdmin);

// GET RELATED PRODUCTS
router.get("/related", getRelatedProducts);
router.get("/:slug", getProductBySlug);

// UPDATE
router.patch("/:id", verifyToken("admin"), upload.array("images", 5), updateProduct);

// DELETE
router.delete("/:id", verifyToken("admin"), deleteProduct);

// GET REVIEWS
router.get("/reviews/:id", getReviews);

// ADD REVIEW
router.post("/:id/review", verifyToken(), addReview);

export default router;
