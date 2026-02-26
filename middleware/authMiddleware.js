// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Protect routes - ensures the user is logged in
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token received in backend:", token);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // ✅ Use decoded.userId (not decoded.id)
      req.user = await User.findById(decoded.userId).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }

      console.log("Authenticated user:", req.user);
      return next();
    } catch (error) {
      console.error("Token invalid:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log("No token in request headers");
    return res.status(401).json({ message: "No token" });
  }
};

/**
 * Admin-only access
 * Must be used after `protect` middleware
 */
export const admin = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Not authorized. User not authenticated" });
  }

  if (!req.user.admin) {
    return res.status(403).json({ message: "Access denied, admin only" });
  }

  // User is admin
  next();
};