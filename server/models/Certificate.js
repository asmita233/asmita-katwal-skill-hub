const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
    userId: {
        type: String, // Clerk user ID
        ref: 'User',
        required: true,
    },
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    courseTitle: {
        type: String,
        required: true,
    },
    certificateId: {
        type: String,
        required: true,
        unique: true,
    },
    completionDate: {
        type: Date,
        default: Date.now,
    },
    pdfUrl: {
        type: String,
        default: '',
    },
}, {
    timestamps: true,
});

// Index for faster queries
certificateSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Certificate = mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
