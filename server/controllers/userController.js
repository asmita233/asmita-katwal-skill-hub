import User from '../models/User.js';
import { clerkClient } from '@clerk/express';
import { syncUserFromClerk } from '../utils/userUtils.js';

// Get user data
export const getUserData = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            console.log('User data request rejected: No userId in auth');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No session found',
            });
        }

        let user = await User.findById(userId);

        // If user not found in DB, try to sync from Clerk
        if (!user) {
            console.log('User not found in DB, trying to sync from Clerk:', userId);
            user = await syncUserFromClerk(userId);
        }

        res.status(200).json({
            success: true,
            user,
        });
    } catch (error) {
        console.error('Error getting user data:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get enrolled courses
export const getEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: Please log in again',
            });
        }

        let user = await User.findById(userId).populate('enrolledCourses.courseId');

        if (!user) {
            console.log('User not found in DB for enrolled courses, syncing from Clerk:', userId);
            user = await syncUserFromClerk(userId);
            // Optionally re-populate after sync if needed, but new users won't have enrollments yet anyway
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            enrolledCourses: user.enrolledCourses || [],
        });
    } catch (error) {
        console.error('Error getting enrolled courses:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update user progress for a course
export const updateProgress = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId, lectureId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        const enrolledCourse = user.enrolledCourses.find(
            (ec) => ec.courseId.toString() === courseId
        );

        if (!enrolledCourse) {
            return res.status(400).json({
                success: false,
                message: 'Course not enrolled',
            });
        }

        if (!enrolledCourse.progress.completedLectures.includes(lectureId)) {
            enrolledCourse.progress.completedLectures.push(lectureId);
        }

        enrolledCourse.progress.lastAccessedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Progress updated',
            progress: enrolledCourse.progress,
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Add to wishlist
export const addToWishlist = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        if (!user.wishlist.includes(courseId)) {
            user.wishlist.push(courseId);
            await user.save();
        }

        res.status(200).json({
            success: true,
            message: 'Added to wishlist',
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Remove from wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        user.wishlist = user.wishlist.filter(
            (id) => id.toString() !== courseId
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Removed from wishlist',
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get wishlist
export const getWishlist = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        let user = await User.findById(userId).populate('wishlist');

        if (!user) {
            console.log('User not found in DB during wishlist fetch, syncing:', userId);
            user = await syncUserFromClerk(userId);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            wishlist: user.wishlist,
        });
    } catch (error) {
        console.error('Error getting wishlist:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Clerk Webhook - Create/Update user from Clerk
export const clerkWebhook = async (req, res) => {
    try {
        const { type, data } = req.body;

        switch (type) {
            case 'user.created':
            case 'user.updated': {
                const userData = {
                    _id: data.id,
                    email: data.email_addresses[0]?.email_address,
                    name:
                        `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
                        data.email_addresses[0]?.email_address,
                    imageUrl: data.image_url || '',
                };

                await User.findByIdAndUpdate(
                    data.id,
                    userData,
                    { upsert: true, new: true }
                );
                break;
            }

            case 'user.deleted':
                await User.findByIdAndDelete(data.id);
                break;
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(400).json({ error: error.message });
    }
};

// Become an educator
export const becomeEducator = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        let user = await User.findByIdAndUpdate(
            userId,
            { role: 'educator' },
            { new: true }
        );

        if (!user) {
            console.log('User not found in DB during become educator, syncing:', userId);
            user = await syncUserFromClerk(userId);
            if (user) {
                user.role = 'educator';
                await user.save();
            }
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        res.status(200).json({
            success: true,
            message: 'You are now an educator!',
            user,
        });
    } catch (error) {
        console.error('Error becoming educator:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Purchase course
export const purchaseCourse = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId } = req.body;
        const { origin } = req.headers;

        let userData = await User.findById(userId);
        
        if (!userData) {
            console.log('User not found in DB during purchase check, syncing:', userId);
            userData = await syncUserFromClerk(userId);
        }

        if (!userData /* || !courseData */) {
            return res.json({
                success: false,
                message: 'User or Course not found',
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
