const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");   // Make sure this file exists

dotenv.config();

const app = express();

// ====================== MIDDLEWARE ======================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS Configuration (Fixed for Render)
const allowedOrigins = [
  "https://asmita-katwal-skill-hub-fontend.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"]
}));

// ====================== ROUTES ======================
// Add all your routes here
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/enrollments", require("./routes/enrollments"));
app.use("/api/reviews", require("./routes/reviews"));

// Add any other routes you have (payments, admin, etc.)
// Example: app.use("/api/payments", require("./routes/payments"));

// Health check route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Skill Hub Backend API is running",
    version: "1.0.0",
    frontend: process.env.FRONTEND_URL || "not set",
    environment: process.env.NODE_ENV || "development"
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: "Route not found" 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

// ====================== START SERVER ======================
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`✅ Allowed Frontend: ${process.env.FRONTEND_URL}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to database or start server:", error);
    process.exit(1);
  }
};

startServer();