const { clerkClient } = require('@clerk/express');
const User = require('../models/User');
const { syncUserFromClerk } = require('../utils/userUtils');

// Middleware to check if user is an educator
const isEducator = async (req, res, next) => {
    try {
        const userId = req.auth.userId;

        let user = await User.findById(userId);

        if (!user) {
            console.log('User not found in DB in isEducator middleware, syncing:', userId);
            user = await syncUserFromClerk(userId);
        }

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
const attachUserData = async (req, res, next) => {
    try {
        if (req.auth && req.auth.userId) {
            let user = await User.findById(req.auth.userId);
            if (!user) {
                user = await syncUserFromClerk(req.auth.userId);
            }
            req.user = user;
        }
        next();
    } catch (error) {
        console.error('attachUserData middleware error:', error);
        next();
    }
};

// Middleware to verify Clerk webhook
const verifyClerkWebhook = async (req, res, next) => {
    try {
        const { Webhook } = require('svix');

        const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET || process.env.CLERK_WEBHOOK_KEY || process.env.CLERK_WEBHOOK_URL;

        if (!WEBHOOK_SECRET) {
            console.error('Webhook Error: Missing CLERK_WEBHOOK_SECRET or KEY');
            throw new Error('Missing clerk secret');
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

module.exports = { isEducator, attachUserData, verifyClerkWebhook };
