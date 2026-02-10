export const localizeProduct = (product, lang) => {
  return {
    _id: product._id,
    slug: product.slug,
    sku: product.sku,

    name: product.name?.[lang],
    description: product.description?.[lang],

    price: product.price,
    discountPrice: product.discountPrice,
    stock: product.stock,

    images: product.images,

    category: product.category?.[lang],
    subcategory: product.subcategory?.[lang],
    tags: product.tags?.[lang],

    averageRating: product.averageRating,
    totalReviews: product.totalReviews,

    createdAt: product.createdAt,
  };
};
