

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true, // Clerk user ID
    },
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    imageUrl: {
        type: String,
        default: '',
    },
    role: {
        type: String,
        enum: ['student', 'educator', 'admin'],
        default: 'student',
    },
    enrolledCourses: [{
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Course',
        },
        enrolledAt: {
            type: Date,
            default: Date.now,
        },
        progress: {
            completedLectures: [{
                type: String, // lectureId
            }],
            lastAccessedAt: {
                type: Date,
                default: Date.now,
            },
        },
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const User = mongoose.model('User', userSchema);

export default User;
