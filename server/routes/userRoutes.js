const express = require('express');
const { requireAuth } = require('@clerk/express');
const {
    getUserData,
    getEnrolledCourses,
    updateProgress,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    clerkWebhook,
    becomeEducator,
} = require('../controllers/userController');

const router = express.Router();

const { verifyClerkWebhook } = require('../middlewares/authMiddleware');

// Clerk webhook - with security verification
router.post('/webhook', verifyClerkWebhook, clerkWebhook);

// Protected routes - require authentication
router.get('/me', requireAuth(), getUserData);
router.get('/enrolled-courses', requireAuth(), getEnrolledCourses);
router.post('/update-progress', requireAuth(), updateProgress);
router.post('/become-educator', requireAuth(), becomeEducator);

// Wishlist routes
router.get('/wishlist', requireAuth(), getWishlist);
router.post('/wishlist', requireAuth(), addToWishlist);
router.delete('/wishlist/:courseId', requireAuth(), removeFromWishlist);

module.exports = router;
