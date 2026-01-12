import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
    lectureId: {
        type: String,
        required: true,
    },
    lectureOrder: {
        type: Number,
        required: true,
    },
    lectureTitle: {
        type: String,
        required: true,
    },
    lectureDuration: {
        type: Number, // in minutes
        default: 0,
    },
    lectureUrl: {
        type: String,
        required: true,
    },
    isPreviewFree: {
        type: Boolean,
        default: false,
    },
});

const chapterSchema = new mongoose.Schema({
    chapterId: {
        type: String,
        required: true,
    },
    chapterOrder: {
        type: Number,
        required: true,
    },
    chapterTitle: {
        type: String,
        required: true,
    },
    chapterContent: [lectureSchema],
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

const courseSchema = new mongoose.Schema({
    courseTitle: {
        type: String,
        required: true,
        trim: true,
    },
    courseDescription: {
        type: String,
        required: true,
    },
    coursePrice: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
    },
    courseThumbnail: {
        type: String,
        default: '',
    },
    category: {
        type: String,
        default: 'General',
    },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
        default: 'All Levels',
    },
    isPublished: {
        type: Boolean,
        default: false,
    },
    courseContent: [chapterSchema],
    educator: {
        type: String, // Clerk user ID
        ref: 'User',
        required: true,
    },
    enrolledStudents: [{
        type: String, // Clerk user ID
        ref: 'User',
    }],
    courseRatings: [ratingSchema],
    totalDuration: {
        type: Number, // in minutes
        default: 0,
    },
    totalLectures: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Pre-save middleware to calculate totals
courseSchema.pre('save', function (next) {
    let totalDuration = 0;
    let totalLectures = 0;

    this.courseContent.forEach((chapter) => {
        totalLectures += chapter.chapterContent.length;
        chapter.chapterContent.forEach((lecture) => {
            totalDuration += lecture.lectureDuration || 0;
        });
    });

    this.totalDuration = totalDuration;
    this.totalLectures = totalLectures;
    next();
});

// Virtual for average rating
courseSchema.virtual('averageRating').get(function () {
    if (this.courseRatings.length === 0) return 0;
    const sum = this.courseRatings.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / this.courseRatings.length) * 10) / 10;
});

// Ensure virtuals are included in JSON
courseSchema.set('toJSON', { virtuals: true });
courseSchema.set('toObject', { virtuals: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
