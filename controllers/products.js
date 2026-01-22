import Product from "../models/Product.js";
import cloudinary from "../utilities/cloudinary.js";

// ======================
// CREATE PRODUCT (Admin)
// ======================
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      slug,
      description,
      price,
      discountPrice,
      stock,
      category,
      subcategory,
      tags,
      variants,
    } = req.body;
    const sku = req.body.sku || "SKU-" + Date.now().toString().slice(-6);
    // Handle image upload (multiple images)
    let images = [];
    if (req.files && req.files.length > 0) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        images.push({
          url: result.secure_url,
          alt: name,
        });
      }
    }

    const newProduct = new Product({
      name,
      slug,
      description,
      price,
      discountPrice,
      stock,
      sku,
      category,
      subcategory,
      tags,
      variants,
      images,
    });

    await newProduct.save();

    res.status(201).json(newProduct);
  } catch (error) {
    console.log("Create Product Error:", error);
    res.status(500).json({ message: "Error creating product" });
  }
};

// ======================
// GET ALL PRODUCTS
// with pagination + filters
// ======================
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      subcategory,
      minPrice,
      maxPrice,
      sort = "createdAt",
      order = "desc",
      search,
    } = req.query;

    const skip = (page - 1) * limit;

    let filter = {};

    // CATEGORY
    if (category) filter.category = category;
    if (subcategory) filter.subcategory = subcategory;

    // PRICE FILTER
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // SEARCH FILTER
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { name: { $regex: regex } },
        { slug: { $regex: regex } },
        { description: { $regex: regex } },
        { category: { $regex: regex } },
        { subcategory: { $regex: regex } },
        { tags: { $in: [regex] } }
      ];
    }

    // BASE QUERY
    let productsQuery = Product.find(filter);

    // =============================
    // SORTING LOGIC (Improved)
    // =============================
    const sortOptions = {};

    if (sort === "price-asc") {
      sortOptions.price = 1;
    } else if (sort === "price-desc") {
      sortOptions.price = -1;
    } else if (sort === "newest") {
      sortOptions.createdAt = -1;
    } else {
      // Generic sort field (ex: sort=name&order=asc)
      sortOptions[sort] = order === "asc" ? 1 : -1;
    }

    productsQuery = productsQuery.sort(sortOptions);

    // =============================
    // PAGINATION
    // =============================
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


// ======================
// GET ONE PRODUCT BY SLUG
// ======================
export const getProductBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).populate("seller");
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// UPDATE PRODUCT (Admin)
// ======================
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ message: "Product not found" });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// DELETE PRODUCT (Admin)
// ======================
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product)
      return res.status(404).json({ message: "Product not found" });

    await Product.findByIdAndDelete(id);

    res.status(200).json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ======================
// ADD REVIEW
// ======================
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


// ======================
// GET RELATED PRODUCTS
// ======================
export const getRelatedProducts = async (req, res) => {
  try {
    const { slug } = req.query;
    const limit = Number(req.query.limit) || 6;

    // 1. Get current product
    const product = await Product.findOne({ slug });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Build similarity filter
    const filter = {
      _id: { $ne: product._id }, // exclude current product
      category: product.category,
    };

    // Optional: subcategory
    if (product.subcategory) {
      filter.subcategory = product.subcategory;
    }

    // Optional: tags boost relevance
    if (product.tags && product.tags.length > 0) {
      filter.$or = [
        { tags: { $in: product.tags } },
        { subcategory: product.subcategory },
      ];
    }
    console.log("PRODUCT:", {
  category: product.category,
  subcategory: product.subcategory,
  tags: product.tags,
});
    // 3. Query related products
    const relatedProducts = await Product.find(filter)
      .limit(limit)
      .select("name slug price discountPrice images averageRating category");

    res.status(200).json({
      products: relatedProducts,
    });
  } catch (error) {
    console.error("Related Products Error:", error);
    res.status(500).json({ message: error.message });
  }
};
