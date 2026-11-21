const express = require("express");
const router = express.Router();

const {
  authenticate,
  authorizeAdmin
} = require("../middleware/authMiddleware");

const {
  getAdminDashboard,
  getStudentDashboard
} = require("../controllers/dashboardController");

// All dashboard routes require authentication
router.use(authenticate);

// Admin dashboard
router.get("/admin", authorizeAdmin, getAdminDashboard);

// Student dashboard
router.get("/student", getStudentDashboard);

module.exports = router;