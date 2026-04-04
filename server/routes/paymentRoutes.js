const express = require('express');
const { requireAuth } = require('@clerk/express');
const {
    createCheckoutSession,
    verifyPayment,
    stripeWebhook,
    getPurchaseHistory,
} = require('../controllers/paymentController');

const router = express.Router();

// Protected routes
router.post('/create-checkout-session', requireAuth(), createCheckoutSession);
router.post('/verify-payment', requireAuth(), verifyPayment);
router.get('/purchase-history', requireAuth(), getPurchaseHistory);

// Stripe webhook - raw body needed
// This route is handled separately in server.js

module.exports = router;
