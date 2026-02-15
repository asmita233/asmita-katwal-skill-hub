import express from 'express';
import { requireAuth } from '@clerk/express';
import {
    generateCertificate,
    getUserCertificates,
    getCertificateById,
    verifyCertificate,
    checkCertificateEligibility,
} from '../controllers/certificateController.js';

const router = express.Router();

// Public routes - verify certificate
router.get('/verify/:certificateId', verifyCertificate);

// Protected routes
router.post('/generate', requireAuth(), generateCertificate);
router.get('/my-certificates', requireAuth(), getUserCertificates);
router.get('/eligibility/:courseId', requireAuth(), checkCertificateEligibility);
router.get('/:certificateId', requireAuth(), getCertificateById);

export default router;
