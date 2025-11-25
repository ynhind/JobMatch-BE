import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Load environment variables
dotenv.config();

// Import database connection
import connectDB from "./config/database.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import employerRoutes from "./routes/employer.routes.js";
import jobseekerRoutes from "./routes/jobseeker.routes.js";

// Initialize express app
const app = express();

// Connect to database
connectDB();

// ============= MIDDLEWARE =============

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
      "http://localhost:5173",
      "https://jobmatch-fe.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Rate limiting - More lenient for production use
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 requests per 15 minutes for general API calls
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limit for auth endpoints (login, register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15 minutes for auth
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiter to all API routes
app.use("/api/", generalLimiter);

// Apply stricter limiter to auth routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ============= ROUTES =============

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/employer", employerRoutes);
app.use("/api/js", jobseekerRoutes);

// Special route for job application (backward compatibility)
app.use("/api/jobs", jobseekerRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to JobMatch API",
    version: "1.0.0",
    docs: "/api/docs",
  });
});

// ============= ERROR HANDLING =============

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "Token expired",
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ============= SERVER =============

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════╗
  ║                                                       ║
  ║   🚀 JobMatch Backend Server                         ║
  ║                                                       ║
  ║   Environment: ${
    process.env.NODE_ENV || "development"
  }                              ║
  ║   Port: ${PORT}                                          ║
  ║   URL: http://localhost:${PORT}                         ║
  ║                                                       ║
  ║   API Docs: http://localhost:${PORT}/api               ║
  ║   Health: http://localhost:${PORT}/health             ║
  ║                                                       ║
  ╚═══════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  server.close(() => process.exit(1));
});

// Handle SIGTERM
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Process terminated");
  });
});

export default app;
