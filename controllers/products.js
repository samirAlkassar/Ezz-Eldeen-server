import Product from "../models/Product.js";
import cloudinary from "../utilities/cloudinary.js";
import {localizeProduct} from "../utilities/localizeProduct.js"
import Cart from "../models/Cart.js";
import Wishlist from "../models/Wishlist.js";
import { recalculateCart } from "../utilities/recalculateCart.js";


// CREATE PRODUCT (Admin)
export const createProduct = async (req, res) => {
  try {
    const { slug, price, discountPrice, stock, variants, sku } = req.body;

    const parseJSONField = (field) => {
      if (!field) return undefined;
      try {
        return JSON.parse(field);
      } catch (err) {
        console.error("Failed to parse field:", field);
        return undefined;
      }
    };

    const name = parseJSONField(req.body.name);
    const description = parseJSONField(req.body.description);
    const category = parseJSONField(req.body.category);
    const subcategory = parseJSONField(req.body.subcategory);
    const tags = parseJSONField(req.body.tags);


    if (!name?.ar || !name?.en) {
      return res.status(400).json({ message: "Name must include ar & en" });
    }
    if (!description?.ar || !description?.en) {
      return res.status(400).json({ message: "Description must include ar & en" });
    }
    if (!category?.ar || !category?.en) {
      return res.status(400).json({ message: "Category must include ar & en" });
    }

    let images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        images.push({
          url: result.secure_url,
          alt: {
            ar: name.ar,
            en: name.en
          },
        });
      }
    }

    const newProduct = new Product({
      name,
      slug,
      description,
      price: Number(price),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      stock: Number(stock),
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      category,
      subcategory,
      tags,
      variants: variants ? parseJSONField(variants) : [],
      images,
    });

    await newProduct.save();

    res.status(201).json(newProduct);

  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: error.message || "Error creating product" });
  }
};



// GET ALL PRODUCTS
// with pagination + filters
export const getProducts = async (req, res) => {
  try {
    const lang = req.lang;

    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort = "newest",
      search,
      minRating,
      maxRating,
    } = req.query;

    const skip = (page - 1) * limit;
    let filter = {};

    // CATEGORY
    if (category) filter[`category.${lang}`] = category;
    if (subcategory) filter[`subcategory.${lang}`] = subcategory;

    // PRICE
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // RATING
    if (minRating || maxRating) {
      filter.averageRating = {};
      if (minRating) filter.averageRating.$gte = Number(minRating);
      if (maxRating) filter.averageRating.$lte = Number(maxRating);
    }

    // SEARCH
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { [`name.${lang}`]: regex },
        { [`description.${lang}`]: regex },
        { [`category.${lang}`]: regex },
        { [`subcategory.${lang}`]: regex },
        { slug: { $regex: regex } },
        { [`tags.${lang}`]: { $in: [regex] } }, // <-- add this line
      ];
    }

    let productsQuery = Product.find(filter);
    // SORT
    const sortOptions = {};
    if (sort === "price-asc") {
      sortOptions.price = 1;
    } else if (sort === "price-desc") {
      sortOptions.price = -1;
    } else if (sort === "rating") {
      sortOptions.averageRating = -1;
    } else if (sort === "newest") {
      sortOptions.createdAt = -1;
    } else {
      sortOptions[sort] = order === "asc" ? 1 : -1;
    }
    productsQuery = productsQuery.sort(sortOptions);

    const products = await productsQuery
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

    res.status(200).json({
      products: products.map(p => localizeProduct(p, lang)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET ONE PRODUCT BY SLUG
export const getProductBySlug = async (req, res) => {
  try {
    const lang = req.lang;
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isActive: true })
      .populate("seller")
      .populate({
        path: "reviews.user",
        select: "firstName lastName picturePath",
      });

    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(localizeProduct(product, lang));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// UPDATE PRODUCT (Admin)

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    console.log("update product body", req.body)
    console.log("FILES:", req.files);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // --------------------------
    // 1️⃣ Update normal fields
    // --------------------------
    const allowedFields = [
      "name",
      "slug",
      "description",
      "price",
      "discountPrice",
      "stock",
      "category",
      "subcategory",
      "tags",
      "variants",
      "isActive"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        try {
          product[field] = typeof req.body[field] === "string" ? JSON.parse(req.body[field]) : req.body[field];
        } catch {
          product[field] = req.body[field];
        }
      }
    });

    // --------------------------
    // 2️⃣ Handle images
    // --------------------------
    // Get existing images (URLs) from frontend
  let existingImages = [];
  if (req.body.existingImages) {
    const urls = Array.isArray(req.body.existingImages)
      ? req.body.existingImages
      : JSON.parse(req.body.existingImages);
    existingImages = product.images.filter(img => urls.includes(img.url));
  }


    // --------------------------
    // 3️⃣ Upload new images if any
    // --------------------------
// 3️⃣ Upload new images if any
  const newFiles = Array.isArray(req.files) ? req.files : [];

  for (const file of newFiles) {
    const upload = await cloudinary.uploader.upload(file.path, {
      folder: "products",
    });

    existingImages.push({
      url: upload.secure_url,
      publicId: upload.public_id,
    });
  }


    // --------------------------
    // 4️⃣ Delete removed images from Cloudinary
    // --------------------------
    const imagesToDelete = product.images.filter(img => !existingImages.find(e => e.url === img.url));
    for (const img of imagesToDelete) {
      if (img.publicId) await cloudinary.uploader.destroy(img.publicId);
    }

    // Set final images
    product.images = existingImages;

    await product.save();

    // --------------------------
    // 5️⃣ Recalculate cart if needed
    // --------------------------
    if (req.body.price !== undefined || req.body.discountPrice !== undefined) {
      await recalculateCart(id);
    }

    res.status(200).json(product);

  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: error.message });
  }
};



// GET PRODUCTS FOR ADMIN
export const getProductsAdmin = async (req, res) => {
    try {
    const lang = req.lang;

    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort = "newest",
      search,
      minRating,
      maxRating,
    } = req.query;

    const skip = (page - 1) * limit;
    let filter = {};

    // CATEGORY
    if (category) filter[`category.${lang}`] = category;
    if (subcategory) filter[`subcategory.${lang}`] = subcategory;

    // PRICE
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // RATING
    if (minRating || maxRating) {
      filter.averageRating = {};
      if (minRating) filter.averageRating.$gte = Number(minRating);
      if (maxRating) filter.averageRating.$lte = Number(maxRating);
    }

    // SEARCH
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { [`name.${lang}`]: regex },
        { [`description.${lang}`]: regex },
        { [`category.${lang}`]: regex },
        { [`subcategory.${lang}`]: { $regex: regex } },
        { slug: { $regex: regex } },
      ];
    }

    let productsQuery = Product.find(filter);
    // SORT
    const sortOptions = {};
    if (sort === "price-asc") {
      sortOptions.price = 1;
    } else if (sort === "price-desc") {
      sortOptions.price = -1;
    } else if (sort === "rating") {
      sortOptions.averageRating = -1;
    } else if (sort === "newest") {
      sortOptions.createdAt = -1;
    } else {
      sortOptions[sort] = order === "asc" ? 1 : -1;
    }
    productsQuery = productsQuery.sort(sortOptions);

    const products = await productsQuery
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filter);

  res.status(200).json({
    products,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    },
  });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// DELETE PRODUCT (Admin)
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Remove from wishlists
    await Wishlist.updateMany(
      { items: id },
      { $pull: { items: id } }
    );

    // Remove from carts
    await Cart.updateMany(
      { "items.product": id },
      { $pull: { items: { product: id } } }
    );

    // 🔥 Recalculate affected carts
    const carts = await Cart.find({});

    for (const cart of carts) {
      cart.totalQuantity = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      cart.totalPrice = cart.items.reduce(
        (sum, item) => sum + item.quantity * item.priceAtTime,
        0
      );

      await cart.save();
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      message: "Product deleted and carts & wishlists synced",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: error.message });
  }
};


// GET REVIEW
export const getReviews = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .select("reviews averageRating totalReviews")
      .populate({
        path: "reviews.user",
        select: "firstName lastName picturePath",
      });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      reviews: product.reviews,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ADD REVIEW
export const addReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { rating, comment } = req.body;

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ message: "Product not foundad" });

    product.reviews.push({
      user: userId,
      rating,
      comment,
    });

    // Recalculate rating
    const totalReviews = product.reviews.length;
    const avg =
      product.reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews;

    product.averageRating = Number(avg.toFixed(2));
    product.totalReviews = totalReviews;

    await product.save();

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// GET RELATED PRODUCTS
export const getRelatedProducts = async (req, res) => {
  try {
    const lang = req.lang;
    const { slug } = req.query;
    const limit = Number(req.query.limit) || 6;

    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const filter = {
      _id: { $ne: product._id },
      [`category.${lang}`]: product.category[lang],
    };

    if (product.subcategory?.[lang]) {
      filter[`subcategory.${lang}`] = product.subcategory[lang];
    }

    if (product.tags?.[lang]?.length > 0) {
      filter.$or = [
        { [`tags.${lang}`]: { $in: product.tags[lang] } },
        { [`subcategory.${lang}`]: product.subcategory?.[lang] },
      ];
    }

    const relatedProducts = await Product.find(filter)
      .limit(limit);

    res.status(200).json({
      products: relatedProducts.map(p =>
        localizeProduct(p, lang)
      ),
    });

  } catch (error) {
    console.error("Related Products Error:", error);
    res.status(500).json({ message: error.message });
  }
};

