import mongoose from "mongoose";

const ReviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      maxLength: 5000,
    },

    // Pricing
    price: {
      type: Number,
      required: true,
    },
    discountPrice: Number,
    currency: {
      type: String,
      default: "EGP",
    },

    // Inventory
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
  sku: {
    type: String,
    unique: true,
    required: true,
  },


    // Category & Tags
    category: {
      type: String,
      required: true,
    },
    subcategory: String,
      tags: [String],

    // Variants (optional: color, size, storage, etc)
    variants: [
      {
        name: String,          // e.g. "color"
        value: String,         // e.g. "black"
      },
    ],

    // Images
    images: [
      {
        url: { type: String, required: true },
        alt: String,
      },
    ],

    // Reviews
    reviews: [ReviewSchema],
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },

    // Seller (if multi-vendor)
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Flags
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

  },
  { timestamps: true }
);

ProductSchema.index({
  name: "text",
  description: "text",
  category: "text"
});

ProductSchema.index({ category: 1 });
ProductSchema.index({ subcategory: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ slug: 1 });

const Product = mongoose.model("Product", ProductSchema);
export default Product;
