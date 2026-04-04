const express = require('express');
const { requireAuth } = require('@clerk/express');
const { enrollCourse, getUserEnrollments, processPayment } = require('../controllers/reportsController');

const router = express.Router();

// S3-T01: Enrollment System API
router.post('/enroll', requireAuth(), enrollCourse);
router.get('/enrollments/:userId', requireAuth(), getUserEnrollments);

// S3-T02: Stripe Payment Integration
router.post('/payment/process', requireAuth(), processPayment);

module.exports = router;
