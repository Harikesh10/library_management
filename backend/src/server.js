const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const helmet = require("helmet");

const homeRoutes = require("./routes/homeRoutes");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const bookRoutes = require("./routes/bookRoutes");
const borrowRoutes = require("./routes/borrowRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors());
app.use(express.json({ limit: "10kb" }));

// Static covers serving
app.use("/images/covers", express.static(path.join(__dirname, "../../frontend/images/covers")));
app.use("/covers", express.static(path.join(__dirname, "../public/covers")));

// Handle malformed JSON requests
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request body"
    });
  }

  next(err);
});

// Silence favicon requests from browsers
app.get("/favicon.ico", (req, res) => res.status(204).end());

// Root route
app.get("/", (req, res) => {
    res.send("Library Management Backend is running!");
});

// Application routes
app.use("/api", homeRoutes);
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/borrow", borrowRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Handle unmatched routes
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);

  res.status(500).json({
    message: "Internal server error"
  });
});


// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});