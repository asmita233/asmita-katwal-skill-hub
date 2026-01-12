import { clerkClient } from '@clerk/express';
import User from '../models/User.js';

// Middleware to check if user is an educator
export const isEducator = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        const user = await User.findById(userId);

        if (!user || user.role !== 'educator') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Educator role required.',
            });
        }

        next();
    } catch (error) {
        console.error('isEducator middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
        });
    }
};

// Middleware to attach user data to request
export const attachUserData = async (req, res, next) => {
    try {
        if (req.auth && req.auth.userId) {
            const user = await User.findById(req.auth.userId);
            req.user = user;
        }
        next();
    } catch (error) {
        console.error('attachUserData middleware error:', error);
        next();
    }
};

// Middleware to verify Clerk webhook
export const verifyClerkWebhook = async (req, res, next) => {
    try {
        const { Webhook } = await import('svix');

        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

        if (!WEBHOOK_SECRET) {
            throw new Error('Missing CLERK_WEBHOOK_SECRET');
        }

        const headers = {
            'svix-id': req.headers['svix-id'],
            'svix-timestamp': req.headers['svix-timestamp'],
            'svix-signature': req.headers['svix-signature'],
        };

        const wh = new Webhook(WEBHOOK_SECRET);
        const payload = JSON.stringify(req.body);

        try {
            wh.verify(payload, headers);
            next();
        } catch (err) {
            console.error('Webhook verification failed:', err);
            res.status(400).json({ error: 'Invalid webhook signature' });
        }
    } catch (error) {
        console.error('Webhook middleware error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
