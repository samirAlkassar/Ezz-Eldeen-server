import express from "express";
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getUserById
} from "../controllers/user.js";

import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

router.get("/me", verifyToken(), getProfile);
router.get("/:id", getUserById);
router.put("/update", verifyToken(), updateProfile);

router.post("/address", verifyToken(), addAddress);
router.put("/address/:addressId", verifyToken(), updateAddress);
router.delete("/address/:addressId", verifyToken(), deleteAddress);

export default router;
