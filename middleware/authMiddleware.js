// middleware/authMiddleware.js
import jwt from "jsonwebtoken";

/**
 * Protect routes - ensures the user is logged in
 * ✅ FIX: Uses JWT payload directly — no DB query on every request
 */
export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Use JWT payload directly — eliminates DB hit on every request
    req.user = {
      _id: decoded.userId,
      email: decoded.email,
      admin: decoded.admin,
    };

    next();
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