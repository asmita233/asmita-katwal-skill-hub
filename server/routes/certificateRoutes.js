const express = require('express');
const { requireAuth } = require('@clerk/express');
const {
    generateCertificate,
    getUserCertificates,
    getCertificateById,
    verifyCertificate,
    checkCertificateEligibility,
} = require('../controllers/certificateController');

const router = express.Router();

// Public routes - verify certificate
router.get('/verify/:certificateId', verifyCertificate);

// Protected routes
router.post('/generate', requireAuth(), generateCertificate);
router.get('/my-certificates', requireAuth(), getUserCertificates);
router.get('/eligibility/:courseId', requireAuth(), checkCertificateEligibility);
router.get('/:certificateId', requireAuth(), getCertificateById);

module.exports = router;
