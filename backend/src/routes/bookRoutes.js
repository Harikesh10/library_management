
const express = require("express");
const router = express.Router();



const {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
} = require("../controllers/bookController");

const {
  authenticate,
  authorizeAdmin
} = require("../middleware/authMiddleware");

const {
  validateIdParam,
  validateBookBody
} = require("../middleware/validationMiddleware");

// Both admin and student can view books
router.get("/", authenticate, getAllBooks);
router.get("/:id", authenticate, getBookById,validateIdParam);

// Only admin can modify inventory
router.post("/", authenticate, authorizeAdmin, createBook,validateBookBody);
router.put("/:id", authenticate, authorizeAdmin, updateBook, validateIdParam,validateBookBody);
router.delete("/:id", authenticate, authorizeAdmin, deleteBook,validateIdParam);

module.exports = router;
