import jwt from "jsonwebtoken";

export const verifyToken = (requiredRole) => {
  return async (req, res, next) => {
    try {
      let token = req.header("Authorization");

      if (!token) {
        return res.status(403).send("Access Denied");
      }

      if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
      }

      const verified = jwt.verify(token, process.env.JWT_SECRET);

      req.user = verified;

      if (requiredRole && req.user.role !== requiredRole) {
        return res.status(403).send("Forbidden: insufficient permissions");
      }

      next();
    } catch (error) {
      res.status(401).json({ error: "Invalid Token" });
    }
  };
};