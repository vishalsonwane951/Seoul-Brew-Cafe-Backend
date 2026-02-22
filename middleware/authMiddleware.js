import jwt from "jsonwebtoken";
import User from "../models/user.js";

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
    console.log("Token received in backend:", token);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
      console.log("Authenticated user:", req.user);
      return next();
    } catch (error) {
      console.error("Token invalid:", error.message);
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  console.log("No token in request headers");
  return res.status(401).json({ message: "No token" });
};


export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Admin access only" });
  }
};
