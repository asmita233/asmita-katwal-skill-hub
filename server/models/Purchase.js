const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    userId: {
        type: String, // Clerk user ID
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        default: 'usd',
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
    },
    paymentMethod: {
        type: String,
        default: 'stripe',
    },
    stripeSessionId: {
        type: String,
        default: '',
    },
    stripePaymentIntentId: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

// Index for faster queries
purchaseSchema.index({ userId: 1, courseId: 1 });
purchaseSchema.index({ stripeSessionId: 1 });

const Purchase = mongoose.model('Purchase', purchaseSchema);

module.exports = Purchase;
