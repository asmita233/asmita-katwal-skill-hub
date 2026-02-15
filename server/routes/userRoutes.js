import express from 'express';
import { requireAuth } from '@clerk/express';
import {
    getUserData,
    getEnrolledCourses,
    updateProgress,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clerkWebhook,
    becomeEducator,
} from '../controllers/userController.js';

const router = express.Router();

// Clerk webhook - no auth required
router.post('/webhook', clerkWebhook);

// Protected routes - require authentication
router.get('/me', requireAuth(), getUserData);
router.get('/enrolled-courses', requireAuth(), getEnrolledCourses);
router.post('/update-progress', requireAuth(), updateProgress);
router.post('/become-educator', requireAuth(), becomeEducator);

// Wishlist routes
router.get('/wishlist', requireAuth(), getWishlist);
router.post('/wishlist', requireAuth(), addToWishlist);
router.delete('/wishlist/:courseId', requireAuth(), removeFromWishlist);

export default router;
