const mongoose = require('mongoose');

// Schema for individual lectures within a chapter
const lectureSchema = new mongoose.Schema({
    lectureId: { type: String, required: true },
    lectureOrder: { type: Number, required: true },
    lectureTitle: { type: String, required: true },
    lectureDescription: { type: String, default: '' }, // Optional description for the lecture
    lectureDuration: { type: Number, default: 0 }, // Length of the video in minutes
    lectureUrl: { type: String, required: true }, // The YouTube or Video link
    lecturePdf: { type: String, default: '' }, // Optional PDF/study material URL (Cloudinary)
    isPreviewFree: { type: Boolean, default: false }, // If true, non-enrolled users can watch this
});

// Schema for chapters that contain multiple lectures
const chapterSchema = new mongoose.Schema({
    chapterId: { type: String, required: true },
    chapterOrder: { type: Number, required: true },
    chapterTitle: { type: String, required: true },
    chapterContent: [lectureSchema], // Array of lectures belonging to this chapter
});

const ratingSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    review: {
        type: String,
        default: '',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// MAIN COURSE SCHEMA
const courseSchema = new mongoose.Schema({
    courseTitle: { type: String, required: true, trim: true },
    courseDescription: { type: String, required: true },
    coursePrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    courseThumbnail: { type: String, default: '' }, // Hosted on Cloudinary
    category: { type: String, default: 'General' },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        default: 'All Levels'
    },
    isPublished: { type: Boolean, default: false }, // Only published courses are visible to students
    courseContent: [chapterSchema], // Nested structure: Course > Chapters > Lectures
    educator: {
        type: String,
        ref: 'User',
        required: true
    }, // Reference to the Clerk User ID of the creator
    enrolledStudents: [{
        type: String,
        ref: 'User'
    }], // List of students who bought the course
    courseRatings: [ratingSchema],
    totalDuration: { type: Number, default: 0 },
    totalLectures: { type: Number, default: 0 },
}, {
    timestamps: true, // Automatically manages createdAt and updatedAt
});


// It automatically calculates the total durationand lecture count by summing up all the chapters.
courseSchema.pre('save', async function () {
    try {
        let totalDuration = 0;
        let totalLectures = 0;

        if (this.courseContent && Array.isArray(this.courseContent)) {
            this.courseContent.forEach((chapter) => {
                if (chapter.chapterContent && Array.isArray(chapter.chapterContent)) {
                    totalLectures += chapter.chapterContent.length;
                    chapter.chapterContent.forEach((lecture) => {
                        totalDuration += Number(lecture.lectureDuration) || 0;
                    });
                }
            });
        }

        this.totalDuration = totalDuration;
        this.totalLectures = totalLectures;
    } catch (error) {
        console.error('Error in pre-save hook:', error);
        throw error;
    }
});

// Virtual for average rating — must be completely null-safe
// because this runs during toJSON() serialization on every course document,

courseSchema.virtual('averageRating').get(function () {
    try {
        if (!this.courseRatings || !Array.isArray(this.courseRatings) || this.courseRatings.length === 0) {
            return 0;
        }
        const ratings = this.courseRatings.filter(r => r && typeof r.rating === 'number');
        if (ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        return Math.round((sum / ratings.length) * 10) / 10;
    } catch (error) {
        return 0;
    }
});

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
