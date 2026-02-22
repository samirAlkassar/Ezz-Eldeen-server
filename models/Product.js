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

const LocalizedString = {
  ar: { type: String, required: true },
  en: { type: String, required: true },
};

const ProductSchema = new mongoose.Schema(
  {
    name: LocalizedString,

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      ar: { type: String, required: true, maxLength: 5000 },
      en: { type: String, required: true, maxLength: 5000 },
    },

    price: {
      type: Number,
      required: true,
    },

    discountPrice: Number,

    currency: {
      type: String,
      default: "EGP",
    },

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

    category: LocalizedString,
    subcategory: {
      ar: String,
      en: String,
    },

    tags: {
      ar: [String],
      en: [String],
    },

    variants: [
      {
        name: String,
        value: String,
      },
    ],

    images: [
      {
        url: { type: String, required: true },
        alt: {
          ar: String,
          en: String,
        },
      },
    ],

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

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductSchema.index({
  "name.ar": "text",
  "name.en": "text",
  "description.ar": "text",
  "description.en": "text",
  "tags.ar": "text",
  "tags.en": "text",
  "category.ar": "text",
  "category.en": "text",
});



ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ "category.ar": 1, averageRating: -1 });
ProductSchema.index({ "category.en": 1, averageRating: -1 });

ProductSchema.index({ slug: 1 });

ProductSchema.index({ "category.ar": 1 });
ProductSchema.index({ "category.en": 1 });

ProductSchema.index({ "subcategory.ar": 1 });
ProductSchema.index({ "subcategory.en": 1 });

ProductSchema.index({ "tags.ar": 1 });
ProductSchema.index({ "tags.en": 1 });


const Product = mongoose.model("Product", ProductSchema);
export default Product;
