import express from "express";
import {
  getProfile,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  getUserById,
  getUsers,
  editUserRole,
  deleteUser,
  addNewUser,
} from "../controllers/user.js";

import { verifyToken } from "../middleware/auth.js";
const router = express.Router();

router.get("/me", verifyToken(), getProfile);
router.get("/all-users", verifyToken("admin"), getUsers);
router.put("/edit-role", verifyToken("admin"), editUserRole);
router.get("/:id", getUserById);
router.put("/update", verifyToken(), updateProfile);
router.delete("/delete", verifyToken("admin"), deleteUser);
router.post("/add", verifyToken("admin"), addNewUser);
router.post("/address", verifyToken(), addAddress);
router.put("/address/:addressId", verifyToken(), updateAddress);
router.delete("/address/:addressId", verifyToken(), deleteAddress);

export default router;
