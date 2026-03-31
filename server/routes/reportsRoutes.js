import express from 'express';
import { requireAuth } from '@clerk/express';
import { enrollCourse, getUserEnrollments, processPayment } from '../controllers/reportsController.js';

const router = express.Router();

// S3-T01: Enrollment System API
router.post('/enroll', requireAuth(), enrollCourse);
router.get('/enrollments/:userId', requireAuth(), getUserEnrollments);

// S3-T02: Stripe Payment Integration
router.post('/payment/process', requireAuth(), processPayment);

export default router;
