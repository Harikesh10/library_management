
const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorizeAdmin
} = require("../middleware/authMiddleware");

const {
  validateIdParam,
  validateBookIdBody
} = require("../middleware/validationMiddleware");

const {
  borrowBook,
  getMyBorrowings,
  getActiveBorrowings,
  returnBook,
  getBorrowRecordById,
  getOverdueBorrowings
} = require("../controllers/borrowController");

// All borrowing routes require authentication
router.use(authenticate);

// Student borrowing
router.post("/", validateBookIdBody, borrowBook);
router.get("/my", getMyBorrowings);

// Admin borrowing management
router.get("/active", authorizeAdmin, getActiveBorrowings);
router.get("/overdue", authorizeAdmin, getOverdueBorrowings);

// Both students and admins can return books
router.patch("/:id/return", validateIdParam, returnBook);

// Individual borrowing record
router.get("/:id", validateIdParam, getBorrowRecordById);

module.exports = router;
