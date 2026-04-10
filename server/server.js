const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./configs/mongodb");
const connectCloudinary = require("./configs/cloudinary");

dotenv.config();

const app = express();

const frontendUrl = process.env.FRONTEND_URL || "https://asmita-katwal-skill-hub-fontend.onrender.com";

console.log("🚀 Starting Skill Hub Backend...");
console.log("Node Environment:", process.env.NODE_ENV || "development");
console.log("Frontend URL:", frontendUrl);
console.log("MongoDB URI Set:", Boolean(process.env.MONGODB_URI));

//middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// CORS
const allowedOrigins = [
  frontendUrl,
  "https://asmita-edemy.vercel.app",
  "https://asmita-katwal-skill-hub.vercel.app",
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

//all the routs
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/courses", require("./routes/courseRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/questions", require("./routes/questionRoutes"));
app.use("/api/certificates", require("./routes/certificateRoutes"));
app.use("/api/reports", require("./routes/reportsRoutes"));

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Skill Hub Backend API is running",
    version: "1.0.0",
    frontend: process.env.FRONTEND_URL || "not set",
    env: process.env.NODE_ENV || "development"
  });
});

// 404 & Error handlers
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error("Server Error:", err.stack);
  res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
});

//start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    connectCloudinary();
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Allowed Frontend: ${frontendUrl}`);
      console.log(` Routes mounted successfully`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error.message);
    process.exit(1);
  }
};

module.exports = app;

// Only start the server when this file is run directly (not imported by tests)
if (require.main === module) {
  startServer();
}