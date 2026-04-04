const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');
const { v4: uuidv4 } = require('uuid');
const { syncUserFromClerk } = require('../utils/userUtils');

// Generate certificate for a completed course
const generateCertificate = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId } = req.body;

        // Get user
        let user = await User.findById(userId);
        if (!user) {
            console.log('User not found in DB during certificate generation, syncing from Clerk:', userId);
            user = await syncUserFromClerk(userId);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        // Check if enrolled
        const enrollment = user.enrolledCourses.find(
            ec => ec.courseId && ec.courseId.toString() === courseId
        );

        if (!enrollment) {
            return res.status(403).json({
                success: false,
                message: 'You are not enrolled in this course',
            });
        }

        // Calculate completion percentage
        let totalLectures = 0;
        course.courseContent?.forEach(chapter => {
            totalLectures += chapter.chapterContent?.length || 0;
        });

        const completedLectures = enrollment.progress?.completedLectures?.length || 0;
        const completionPercentage = totalLectures > 0
            ? Math.round((completedLectures / totalLectures) * 100)
            : 0;

        // Check if course is completed (100%)
        if (completionPercentage < 100) {
            return res.status(400).json({
                success: false,
                message: `Course completion is ${completionPercentage}%. You need 100% to get a certificate.`,
                completionPercentage,
            });
        }

        // Check if certificate already exists
        let certificate = await Certificate.findOne({ userId, courseId });

        if (certificate) {
            return res.status(200).json({
                success: true,
                message: 'Certificate already exists',
                certificate,
            });
        }

        // Generate unique certificate ID
        const certificateId = `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

        // Create certificate
        certificate = new Certificate({
            userId,
            courseId,
            userName: user.name,
            courseTitle: course.courseTitle,
            certificateId,
            completionDate: new Date(),
        });

        await certificate.save();

        res.status(201).json({
            success: true,
            message: 'Certificate generated successfully',
            certificate,
        });
    } catch (error) {
        console.error('Error generating certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get user's certificates (with auto-generation for completed courses)
const getUserCertificates = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized',
            });
        }

        // Fetch the user with their course progress
        let user = await User.findById(userId).populate('enrolledCourses.courseId');
        if (!user) {
            user = await syncUserFromClerk(userId);
            if (user) {
                user = await User.findById(userId).populate('enrolledCourses.courseId');
            }
        }

        if (user && user.enrolledCourses?.length > 0) {
            // Check for potential new certificates to generate
            for (const enrolled of user.enrolledCourses) {
                const course = enrolled.courseId;
                if (!course) continue;

                // Calculate current completion
                let totalLectures = 0;
                course.courseContent?.forEach(chapter => {
                    totalLectures += chapter.chapterContent?.length || 0;
                });

                const completedCount = enrolled.progress?.completedLectures?.length || 0;
                const progress = totalLectures > 0 ? Math.round((completedCount / totalLectures) * 100) : 0;

                // If 100% done, check if certificate exists
                if (progress >= 100) {
                    const exists = await Certificate.findOne({ userId, courseId: course._id });
                    if (!exists) {
                        try {
                            const certificateId = `CERT-${uuidv4().split('-')[0].toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
                            const newCert = new Certificate({
                                userId,
                                courseId: course._id,
                                userName: user.name,
                                courseTitle: course.courseTitle,
                                certificateId,
                                completionDate: new Date(),
                            });
                            await newCert.save();
                            console.log(`Auto-generated certificate for user ${userId} / course ${course.courseTitle}`);
                        } catch (err) {
                            console.error('Failed to auto-generate certificate during fetch:', err.message);
                        }
                    }
                }
            }
        }

        // Now return the full list of certificates
        const certificates = await Certificate.find({ userId })
            .populate('courseId', 'courseTitle courseThumbnail')
            .sort({ completionDate: -1 });

        res.status(200).json({
            success: true,
            certificates: certificates || [],
        });
    } catch (error) {
        console.error('Error getting certificates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load certificates. Please try again.',
        });
    }
};

// Get certificate by ID
const getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId })
            .populate('courseId', 'courseTitle courseThumbnail educator')
            .populate('userId', 'name imageUrl');

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found',
            });
        }

        res.status(200).json({
            success: true,
            certificate,
        });
    } catch (error) {
        console.error('Error getting certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Verify certificate (public)
const verifyCertificate = async (req, res) => {
    try {
        const { certificateId } = req.params;

        const certificate = await Certificate.findOne({ certificateId })
            .populate('courseId', 'courseTitle')
            .select('userName courseTitle completionDate certificateId');

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found or invalid',
                valid: false,
            });
        }

        res.status(200).json({
            success: true,
            valid: true,
            certificate: {
                certificateId: certificate.certificateId,
                userName: certificate.userName,
                courseTitle: certificate.courseTitle,
                completionDate: certificate.completionDate,
            },
        });
    } catch (error) {
        console.error('Error verifying certificate:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Check if user can get certificate for a course
const checkCertificateEligibility = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId } = req.params;

        // Get user
        let user = await User.findById(userId);
        if (!user) {
            console.log('User not found in DB during eligibility check, syncing from Clerk:', userId);
            user = await syncUserFromClerk(userId);
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Get course
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        // Check enrollment
        const enrollment = user.enrolledCourses.find(
            ec => ec.courseId && ec.courseId.toString() === courseId
        );

        if (!enrollment) {
            return res.status(200).json({
                success: true,
                eligible: false,
                reason: 'Not enrolled in this course',
                completionPercentage: 0,
            });
        }

        // Calculate completion
        let totalLectures = 0;
        course.courseContent?.forEach(chapter => {
            totalLectures += chapter.chapterContent?.length || 0;
        });

        const completedLectures = enrollment.progress?.completedLectures?.length || 0;
        const completionPercentage = totalLectures > 0
            ? Math.round((completedLectures / totalLectures) * 100)
            : 0;

        // Check if certificate exists
        const existingCertificate = await Certificate.findOne({ userId, courseId });

        res.status(200).json({
            success: true,
            eligible: completionPercentage >= 100,
            alreadyHasCertificate: !!existingCertificate,
            certificate: existingCertificate,
            completionPercentage,
            requiredPercentage: 100,
        });
    } catch (error) {
        console.error('Error checking eligibility:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    generateCertificate,
    getUserCertificates,
    getCertificateById,
    verifyCertificate,
    checkCertificateEligibility,
};
