// middleware/lang.middleware.js
export const langMiddleware = (req, res, next) => {
  const lang =
    req.query.lang ||
    req.headers["accept-language"]?.split(",")[0]?.slice(0, 2) ||
    "ar";

  req.lang = ["ar", "en"].includes(lang) ? lang : "ar";
  next();
};
