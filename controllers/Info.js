// server.js or routes/info.js
import express from "express";
const router = express.Router();

router.get("/cafe-info", (req, res) => {
  res.json({
    hours: [
      { day: "Monday", time: "8 AM – 8 PM" },
      { day: "Tuesday", time: "8 AM – 8 PM" },
      // ...
    ],
    address: {
      line1: "123 Main St",
      line2: "Koregaon Park, Pune",
      phone: "+91 98765 43210",
      email: "hello@cafe.com"
    }
  });
});

export default router;