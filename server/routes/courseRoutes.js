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
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only videos are allowed'), false);
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

// Educator routes
router.get('/educator/my-courses', requireAuth(), getEducatorCourses);
router.get('/educator/dashboard', requireAuth(), getEducatorDashboard);
router.get('/educator/students', requireAuth(), getEnrolledStudents);

export default router;
