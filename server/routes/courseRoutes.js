import express from 'express';
import { requireAuth } from '@clerk/express';
import multer from 'multer';
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
    uploadThumbnail,
    uploadVideo,
    uploadPdf,
    togglePublish,
    addRating,
    getEducatorCourses,
    getEducatorDashboard,
    getEnrolledStudents,
    // Content Management
    updateCourseContent,
    reorderContent,
    deleteSection,
    deleteLecture,
    updateSection,
    updateLecture,
} from '../controllers/courseController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for images
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    },
});

const uploadVideoMulter = multer({
    storage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit for videos (increased for production use)
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed (mp4, webm, etc.)'), false);
        }
    },
});

const uploadPdfMulter = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for PDFs
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF and document files are allowed'), false);
        }
    },
});

// Public routes
router.get('/', getAllCourses);

// Educator routes — MUST come BEFORE /:id to avoid route collision
// (otherwise 'educator' would be treated as a course ID)
router.get('/educator/my-courses', requireAuth(), getEducatorCourses);
router.get('/educator/dashboard', requireAuth(), getEducatorDashboard);
router.get('/educator/students', requireAuth(), getEnrolledStudents);

// Public route for single course details (must come AFTER /educator/* routes)
router.get('/:id', getCourseById);

// Protected routes - require authentication
router.post('/', requireAuth(), createCourse);
router.put('/:id', requireAuth(), updateCourse);
router.delete('/:id', requireAuth(), deleteCourse);
router.post('/:id/thumbnail', requireAuth(), upload.single('thumbnail'), uploadThumbnail);
router.post('/upload-video', requireAuth(), uploadVideoMulter.single('video'), uploadVideo);
router.post('/upload-pdf', requireAuth(), uploadPdfMulter.single('pdf'), uploadPdf);
router.patch('/:id/publish', requireAuth(), togglePublish);
router.post('/:id/rating', requireAuth(), addRating);

// ============================================================
// CONTENT MANAGEMENT ROUTES
// ============================================================
router.put('/:id/content', requireAuth(), updateCourseContent);
router.put('/:id/reorder', requireAuth(), reorderContent);
router.delete('/:id/section/:sectionId', requireAuth(), deleteSection);
router.delete('/:id/section/:sectionId/lecture/:lectureId', requireAuth(), deleteLecture);
router.put('/:id/section/:sectionId', requireAuth(), updateSection);
router.put('/:id/section/:sectionId/lecture/:lectureId', requireAuth(), updateLecture);

export default router;
