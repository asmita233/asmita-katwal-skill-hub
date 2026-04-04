const User = require('../models/User');
const { clerkClient } = require('@clerk/express');

/**
 * Syncs a user from Clerk to the local database.
 * Useful when webhooks haven't fired yet but the user is already authenticated.
 * @param {string} userId - The Clerk user ID
 * @returns {Promise<Object|null>} The synced user object or null if failed
 */
const syncUserFromClerk = async (userId) => {
    try {
        if (!userId) return null;
        
        const clerkUser = await clerkClient.users.getUser(userId);
        if (clerkUser) {
            const userData = {
                _id: clerkUser.id,
                email: clerkUser.emailAddresses[0]?.emailAddress,
                name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || clerkUser.emailAddresses[0]?.emailAddress,
                imageUrl: clerkUser.imageUrl || '',
            };
            
            // Use findByIdAndUpdate with upsert to create or update
            const user = await User.findByIdAndUpdate(
                userId, 
                userData, 
                { upsert: true, new: true }
            );
            
            console.log(`Successfully synced user ${userId} from Clerk`);
            return user;
        }
    } catch (error) {
        console.error(`Error syncing user ${userId} from Clerk:`, error.message);
    }
    return null;
};

module.exports = { syncUserFromClerk };
