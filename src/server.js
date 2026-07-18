const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Database Connection
const connectDB = require("./config/db");
const { isDbConnected } = require("./config/db");

// Connect to MongoDB
connectDB();

// Routes
const authRoutes = require("./routes/authRoutes");
const baseRoutes = require("./routes/baseRoutes");
const assetRoutes = require("./routes/assetRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const transferRoutes = require("./routes/transferRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const expenditureRoutes = require("./routes/expenditureRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const auditLogRoutes = require("./routes/auditLogRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed CORS origins (Vercel frontend + local dev)
const allowedOrigins = [
  "https://frontend-military-assest-management-inky.vercel.app",
  "https://frontend-military-assest-management-teal.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

// Middleware
// NOTE: axios only sends a Bearer token header (no cookies), so credentials
// are NOT required. With credentials:true the browser forbids a wildcard/
// reflected origin, so we use an exact-origin match from the allowlist instead.
app.use(
  cors({
    origin: (origin, callback) => {
      // allow same-origin / non-browser tools (origin undefined) and listed origins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS not allowed for origin: ${origin}`));
      }
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));

// Block API calls when DB is not connected, with a clear message
// (avoids a confusing generic 500 from every query).
app.use("/api", (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      message: "Database unavailable. Check MongoDB Atlas Network Access / connection.",
    });
  }
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/bases", baseRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/expenditures", expenditureRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// Health Check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Military Asset Management System API is running.",
    dbConnected: isDbConnected(),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running on http://localhost:${PORT}`);
});