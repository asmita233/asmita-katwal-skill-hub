const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    lectureId: {
        type: String,
        default: '',
    },
    chapterId: {
        type: String,
        default: '',
    },
    userId: {
        type: String, // Clerk user ID
        ref: 'User',
        required: true,
    },
    userName: {
        type: String,
        required: true,
    },
    userImage: {
        type: String,
        default: '',
    },
    question: {
        type: String,
        required: true,
    },
    answers: [{
        userId: {
            type: String,
            ref: 'User',
        },
        userName: {
            type: String,
        },
        userImage: {
            type: String,
        },
        answer: {
            type: String,
            required: true,
        },
        isInstructor: {
            type: Boolean,
            default: false,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    isResolved: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Index for faster queries
questionSchema.index({ courseId: 1 });
questionSchema.index({ lectureId: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;
