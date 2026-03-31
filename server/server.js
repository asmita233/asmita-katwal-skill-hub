import express from 'express'; // Standard framework for building the web server
import cors from 'cors'; // Enables Cross-Origin Resource Sharing (allows frontend to talk to backend)
import 'dotenv/config'; // Loads environment variables from .env file
import connectDB from './configs/mongodb.js'; // Helper function to connect to MongoDB
import connectCloudinary from './configs/cloudinary.js'; // Helper function to connect to Cloudinary storage
import { clerkMiddleware } from '@clerk/express'; // Middleware for Clerk authentication
import { stripeWebhook } from './controllers/paymentController.js'; // Controller for Stripe payment events

// Import API routes for different features
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';

const app = express(); // Initialize the Express application

// Initializing Media storage connection
connectCloudinary();

// Stripe webhook route - CRITICAL: Must be placed before express.json() 
// because it needs the raw request body to verify the stripe signature.
app.post(
  '/api/payment/stripe-webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// General Middlewares
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5174',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ],
  credentials: true,
}));
app.use(express.json()); // Automatically parse JSON data in requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Global Clerk Authentication Middleware
app.use(clerkMiddleware());

// Serve static files (like images) if any are saved locally in 'uploads'
app.use('/uploads', express.static('uploads'));

// Define the hierarchy of API routes
app.use('/api/user', userRoutes); // Handles profile and progress
app.use('/api/courses', courseRoutes); // Handles course creation and listing
app.use('/api/payment', paymentRoutes); // Handles Stripe sessions
app.use('/api/questions', questionRoutes); // Handles Q&A messaging
app.use('/api/certificates', certificateRoutes); // Handles certificate logic
app.use('/api', reportsRoutes); // Specialized routes for report screenshots (S3-T01, S3-T02)

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Edemy LMS API is running',
    version: '1.0.0',
  });
});

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Port
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});