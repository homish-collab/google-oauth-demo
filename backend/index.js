const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");
const { testEmailConfig } = require("./services/emailService");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 9000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per windowMs
  message: "Too many authentication attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging
app.use(morgan('combined'));

// CORS configuration
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log("✅ MongoDB Connected");
  
  // Test email configuration on startup
  const emailConfigValid = await testEmailConfig();
  if (emailConfigValid) {
    console.log("✅ Email service configured successfully");
  } else {
    console.warn("⚠️ Email service configuration issues detected");
  }
}).catch(err => {
  console.error("❌ MongoDB Connection Error:", err);
  process.exit(1);
});

// Routes
const authRoutes = require("./routes/authRoutes");
const { verifyToken } = require("./middleware/verifyToken");

// Apply auth rate limiting to auth routes
app.use("/auth", authLimiter, authRoutes);

// Protected route example
app.get("/protected", verifyToken, (req, res) => {
  res.status(200).json({ 
    message: "Access granted to protected route", 
    user: req.user 
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ 
      message: "Validation Error", 
      details: errors 
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ 
      message: `${field} already exists` 
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: "Invalid token" });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: "Token expired" });
  }
  
  // Default error
  res.status(err.status || 500).json({ 
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📧 Email service: ${process.env.EMAIL_SERVICE || 'Not configured'}`);
  console.log(`🛡️ Environment: ${process.env.NODE_ENV || 'development'}`);
});
