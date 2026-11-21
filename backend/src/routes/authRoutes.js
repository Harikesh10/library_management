const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const {
    login,
    logout,
    getMe
} = require("../controllers/authController");

const {
    authenticate
} = require("../middleware/authMiddleware");


//Rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Maximum 10 attempts per window
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    message: "Too many login attempts. Please try again later."
  }
});

// Login
router.post("/login", loginLimiter, login);

// Get logged-in user
router.get("/me", authenticate, getMe);

// Logout
router.post("/logout", authenticate, logout);




module.exports = router;