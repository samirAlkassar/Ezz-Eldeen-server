import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";

import { register } from "./controllers/auth.js";
import upload from "./middleware/multer.js";
import { verifyToken } from "./middleware/auth.js";
import { createProduct } from "./controllers/products.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js";
import productsRoutes from "./routes/products.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/order.js";
import wishlistRoutes from "./routes/wishlist.js";
import {updateProfilePicture} from "./controllers/user.js"

// Configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

app.use(express.json());
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

// Static Assets
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://ezz-eldeen.vercel.app",
      "https://ezz-eldeen-eeybhpiqn-samiralkassars-projects.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Routes with file upload
app.post("/auth/register", upload.single("images"), register);

// Recommended: move to productsRoutes instead
app.post("/products", verifyToken, upload.array("images", 5), createProduct);

// Main Routes
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/products", productsRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/wishlist", wishlistRoutes);
app.put(
  "/user/profile-picture",
  verifyToken,
  upload.single("image"),   // <--- IMPORTANT
  updateProfilePicture
);


// Mongoose Setup
const PORT = process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT} 🟢`));
  })
  .catch((error) => console.log(`${error} did not connect 🔴`));

