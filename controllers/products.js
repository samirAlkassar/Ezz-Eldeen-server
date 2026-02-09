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

    if (!name?.ar || !name?.en) {
      return res.status(400).json({ message: "Name must have ar & en" });
    }

    const sku = req.body.sku || "SKU-" + Date.now().toString().slice(-6);

    let images = [];
    if (req.files?.length) {
      for (let file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });
        images.push({
          url: result.secure_url,
          alt: name, // { ar, en }
        });
      }
    }

    const newProduct = await Product.create({
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

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: "Error creating product" });
  }
};


// ======================
// GET ALL PRODUCTS
// with pagination + filters
// ======================
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
    const filter = { isActive: true };

    // CATEGORY (localized)
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

    // SEARCH (language-aware)
    if (search) {
      const regex = new RegExp(search, "i");
      filter.$or = [
        { [`name.${lang}`]: regex },
        { [`description.${lang}`]: regex },
        { [`category.${lang}`]: regex },
        { slug: regex },
      ];
    }

    // SORT
    const sortOptions = {
      price: sort === "price-asc" ? 1 : sort === "price-desc" ? -1 : undefined,
      averageRating: sort === "rating" ? -1 : undefined,
      createdAt: sort === "newest" ? -1 : undefined,
    };

    const products = await Product.find(filter)
      .sort(sortOptions)
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



// ======================
// GET ONE PRODUCT BY SLUG
// ======================
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
// GET REVIEW
// ======================
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

