// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Protect routes - ensures the user is logged in
 */
export const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      console.log("Token received:", token);

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      next();
    } else {
      return res.status(401).json({ message: "No token provided" });
    }
  } catch (error) {
    console.error("Auth error:", error.message);
    res.status(401).json({ message: "Not authorized" });
  }
};

/**
 * Admin-only access
 * Must be used after `protect` middleware
 */
export const admin = (req, res, next) => {
  if (!req.user || !req.user.admin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};