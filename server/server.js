import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import connectCloudinary from './configs/cloudinary.js';
import { clerkMiddleware } from '@clerk/express';
import { stripeWebhook } from './controllers/paymentController.js';

// Import routes
import userRoutes from './routes/userRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const app = express();

// Connect to MongoDB
connectDB();

// Connect to Cloudinary
connectCloudinary();

// Stripe webhook - needs raw body (before other middleware)
app.post(
  '/api/payment/stripe-webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhook
);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Clerk middleware
app.use(clerkMiddleware());

// Static files for uploads
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/user', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/payment', paymentRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Edemy LMS API is running',
    version: '1.0.0',
  });
});

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

// Create uploads directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}
//Routes
app.get ('/', (req, res) => res.send ('API is running...'))

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on PORT ${PORT}`);
});