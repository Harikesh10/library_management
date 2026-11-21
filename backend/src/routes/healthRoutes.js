const express = require("express");
const router = express.Router();

const db = require("../config/db");

// GET /api/health
router.get("/", (req, res) => {
    res.status(200).json({
        message: "Backend API is healthy and running!",
        status: "success"
    });
});

// GET /api/health/db
router.get("/db", async (req, res) => {
    try {
        await db.query("SELECT 1");

        res.status(200).json({
            message: "MySQL connected successfully!",
            status: "success"
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Database connection failed",
            status: "error"
        });
    }
});

module.exports = router;
