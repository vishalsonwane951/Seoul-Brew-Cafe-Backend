// Register
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserModel from "../models/userModel.js"


// Register


export const registerUser = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, admin } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const name = `${firstName} ${lastName}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new UserModel({ // ✅ use UserModel here
      name,
      email,
      password: hashedPassword,
      phone,
      admin: admin || false,
    });

    await user.save();

    res.status(201).json({
      message: "User registered successfully",
      userId: user._id,
      admin: user.admin,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Registration failed" });
  }
};

// Login

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const secretKey = process.env.JWT_SECRET || "your_jwt_secret";

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, admin: user.admin },
      secretKey,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      admin: user.admin,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "Login failed" });
  }
};  