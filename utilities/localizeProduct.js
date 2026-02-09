export const localizeProduct = (product, lang) => ({
  id: product._id,
  name: product.name[lang],
  description: product.description[lang],
  price: product.price,
  discountPrice: product.discountPrice,
  currency: product.currency,
  stock: product.stock,
  category: product.category[lang],
  subcategory: product.subcategory?.[lang],
  tags: product.tags?.[lang] || [],
  images: product.images.map(img => ({
    url: img.url,
    alt: img.alt?.[lang],
  })),
  rating: product.averageRating,
});
