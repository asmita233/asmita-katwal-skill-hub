import express from 'express';
import { requireAuth } from '@clerk/express';
import {
    createCheckoutSession,
    verifyPayment,
    stripeWebhook,
    getPurchaseHistory,
} from '../controllers/paymentController.js';

const router = express.Router();

// Protected routes
router.post('/create-checkout-session', requireAuth(), createCheckoutSession);
router.post('/verify-payment', requireAuth(), verifyPayment);
router.get('/purchase-history', requireAuth(), getPurchaseHistory);

// Stripe webhook - raw body needed
// This route is handled separately in server.js

export default router;
