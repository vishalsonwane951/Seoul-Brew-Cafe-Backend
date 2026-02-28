// server.js or routes/info.js
import express from "express";
const router = express.Router();

router.get("/cafe-info", (req, res) => {
  res.json({
    hours: [
      { day: "Monday - Friday", time: "9 AM – 10 PM" },
      { day: "Saturday - Sunday", time: "10 AM – 8 PM" },
      // ...
    ],
    address: {
      // line1: "123 Main St",
      line2: "Sihgad Law  College, Pune",
      phone: "+91 7888251550",
      email: "goodluck@cafe.com"
    }
  });
});

export default router;