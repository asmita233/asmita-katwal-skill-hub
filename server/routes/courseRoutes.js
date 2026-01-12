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
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
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
router.patch('/:id/publish', requireAuth(), togglePublish);
router.post('/:id/rating', requireAuth(), addRating);

// Educator routes
router.get('/educator/my-courses', requireAuth(), getEducatorCourses);
router.get('/educator/dashboard', requireAuth(), getEducatorDashboard);
router.get('/educator/students', requireAuth(), getEnrolledStudents);

export default router;
