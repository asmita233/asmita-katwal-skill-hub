const Course = require('../models/Course');
const User = require('../models/User');
const { v2: cloudinary } = require('cloudinary');
const Purchase = require('../models/Purchase');
const fs = require('fs');
const { syncUserFromClerk } = require('../utils/userUtils');

// Get all courses (public)
const getAllCourses = async (req, res) => {
    try {
        const {
            search,
            category,
            level,
            minPrice,
            maxPrice,
            sort = 'createdAt',
            order = 'desc',
            page = 1,
            limit = 12
        } = req.query;


        // Build query
        const query = {};

        if (search) {
            query.$or = [
                { courseTitle: { $regex: search, $options: 'i' } },
                { courseDescription: { $regex: search, $options: 'i' } },
            ];
        }

        if (category) {
            query.category = category;
        }

        if (level) {
            query.level = level;
        }

        if (minPrice || maxPrice) {
            query.coursePrice = {};
            if (minPrice) query.coursePrice.$gte = Number(minPrice);
            if (maxPrice) query.coursePrice.$lte = Number(maxPrice);
        }

        // Sort options
        const sortOptions = {};
        sortOptions[sort] = order === 'desc' ? -1 : 1;

        // Execute query with pagination
        const skip = (Number(page) - 1) * Number(limit);

        const courses = await Course.find(query)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .populate('educator', 'name imageUrl');

        const total = await Course.countDocuments(query);

        res.status(200).json({
            success: true,
            courses,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / Number(limit)),
                totalCourses: total,
            },
        });
    } catch (error) {
        console.error('Error getting courses:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get single course by ID (public)
const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;

        const course = await Course.findById(id).populate('educator', 'name imageUrl email');

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        res.status(200).json({
            success: true,
            course,
        });
    } catch (error) {
        console.error('Error getting course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Create a new course (educator only)
const createCourse = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        console.log('Create course request received');
        console.log('User ID:', userId);
        console.log('Request body:', JSON.stringify(req.body, null, 2));

        if (!userId) {
            console.log('Error: No user ID found');
            return res.status(401).json({
                success: false,
                message: 'Unauthorized: No user ID found in request'
            });
        }

        const {
            courseTitle,
            courseDescription,
            coursePrice,
            discount,
            category,
            level,
            courseContent
        } = req.body;

        // Validate required fields
        if (!courseTitle || !courseDescription) {
            console.log('Error: Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'Course title and description are required',
            });
        }

        // Check if user exists in database, if not create them
        let existingUser = await User.findById(userId);
        if (!existingUser) {
            console.log('User not found in DB during course creation, syncing from Clerk:', userId);
            existingUser = await syncUserFromClerk(userId);
        }

        if (!existingUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create course
        const course = new Course({
            courseTitle,
            courseDescription,
            coursePrice: Number(coursePrice) || 0,
            discount: Number(discount) || 0,
            category: category || 'General',
            level: level || 'All Levels',
            courseContent: courseContent || [],
            educator: userId,
            isPublished: true,
        });

        console.log('Attempting to save course:', course.courseTitle);
        await course.save();
        console.log('Course saved successfully with ID:', course._id);

        // Update user role to educator if not already
        await User.findByIdAndUpdate(userId, { role: 'educator' });
        console.log('User role updated to educator');

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course,
        });
    } catch (error) {
        console.error('Error creating course:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Internal Server Error',
            details: error.errors ? Object.keys(error.errors).map(key => error.errors[key].message) : []
        });
    }
};

// Update course (educator only)
const updateCourse = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        const updates = req.body;

        // Find course and verify ownership
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        if (course.educator !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this course',
            });
        }

        // Update course
        Object.assign(course, updates);
        await course.save();

        res.status(200).json({
            success: true,
            message: 'Course updated successfully',
            course,
        });
    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete course (educator only)
const deleteCourse = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        if (course.educator !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this course',
            });
        }

        await Course.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Course deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Upload course thumbnail
const uploadThumbnail = async (req, res) => {
    try {
        const auth = typeof req.auth === 'function' ? req.auth() : req.auth;
        const userId = auth?.userId;
        const { id } = req.params;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
            });
        }

        // Find course and verify ownership
        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        if (course.educator !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'edemy/thumbnails',
            resource_type: 'image',
        });

        // Update course with thumbnail URL
        course.courseThumbnail = result.secure_url;
        await course.save();

        // Remove temporary file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: 'Thumbnail uploaded successfully',
            thumbnailUrl: result.secure_url,
        });
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Upload lecture video
const uploadVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No video file uploaded',
            });
        }

        console.log('Uploading video to Cloudinary:', req.file.path);

        // Upload to Cloudinary with resource_type: 'video'
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'edemy/lectures',
            resource_type: 'video',
        });

        // Remove temporary file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: 'Video uploaded successfully',
            videoUrl: result.secure_url,
        });
    } catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Upload PDF/study material for a lecture
const uploadPdf = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No PDF file uploaded',
            });
        }

        console.log('Uploading PDF to Cloudinary:', req.file.path);

        // Upload to Cloudinary with resource_type: 'raw' for non-media files
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'edemy/materials',
            resource_type: 'raw',
        });

        // Remove temporary file
        fs.unlinkSync(req.file.path);

        res.status(200).json({
            success: true,
            message: 'PDF uploaded successfully',
            pdfUrl: result.secure_url,
        });
    } catch (error) {
        console.error('Error uploading PDF:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Toggle publish status  allow tecaher to work on course
const togglePublish = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        if (course.educator !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        course.isPublished = !course.isPublished;
        await course.save();

        res.status(200).json({
            success: true,
            message: `Course ${course.isPublished ? 'published' : 'unpublished'} successfully`,
            isPublished: course.isPublished,
        });
    } catch (error) {
        console.error('Error toggling publish:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Add rating/review
const addRating = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { id } = req.params;
        const { rating, review } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
            });
        }

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        // Check if user is enrolled
        if (!course.enrolledStudents.includes(userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only enrolled students can review this course',
            });
        }

        // Check if already rated
        const existingRating = course.courseRatings.find((r) => r.userId === userId);

        if (existingRating) {
            // Update existing rating
            existingRating.rating = rating;
            existingRating.review = review || '';
            existingRating.createdAt = new Date();
        } else {
            // Add new rating
            course.courseRatings.push({
                userId,
                rating,
                review: review || '',
            });
        }

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Rating added successfully',
            courseRatings: course.courseRatings,
        });
    } catch (error) {
        console.error('Error adding rating:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get educator's courses
const getEducatorCourses = async (req, res) => {
    try {
        const userId = req.auth.userId;

        const courses = await Course.find({ educator: userId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            courses,
        });
    } catch (error) {
        console.error('Error getting educator courses:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get educator dashboard data
const getEducatorDashboard = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Get all courses by educator
        const courses = await Course.find({ educator: userId });
        const courseIds = courses.map(c => c._id);

        // Fetch valid purchases for these courses
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle');

        // Calculate totals
        let totalEarnings = 0;
        purchases.forEach(purchase => {
            totalEarnings += purchase.amount;
        });

        // Get unique enrolled students count
        const uniqueStudents = new Set();
        purchases.forEach(purchase => uniqueStudents.add(purchase.userId?._id?.toString() || purchase.userId?.toString()));

        // Format recent enrollments
        const recentEnrollments = purchases
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 10)
            .map(purchase => ({
                student: purchase.userId || { name: 'Deleted User', imageUrl: '' },
                courseTitle: purchase.courseId?.courseTitle || 'Deleted Course',
                purchaseDate: purchase.createdAt
            }));

        res.status(200).json({
            success: true,
            totalEarnings,
            totalCourses: courses.length,
            totalStudents: uniqueStudents.size,
            enrolledStudentsData: recentEnrollments,
        });
    } catch (error) {
        console.error('Error getting dashboard:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get enrolled students for educator
const getEnrolledStudents = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Get all courses by educator
        const courses = await Course.find({ educator: userId });
        const courseIds = courses.map(c => c._id);

        // Fetch all purchases for these courses
        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
            .populate('userId', 'name imageUrl email')
            .populate('courseId', 'courseTitle')
            .sort({ createdAt: -1 });

        const enrollmentsData = purchases.map(purchase => ({
            student: purchase.userId || { name: 'Deleted User', imageUrl: '', email: '' },
            courseTitle: purchase.courseId?.courseTitle || 'Deleted Course',
            purchaseDate: purchase.createdAt
        }));

        res.status(200).json({
            success: true,
            enrollments: enrollmentsData,
        });
    } catch (error) {
        console.error('Error getting enrolled students:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// ============================================================
// COURSE CONTENT MANAGEMENT (Sections & Lectures)
// ============================================================

// Update entire course content (sections + lectures)
const updateCourseContent = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        const { courseContent } = req.body;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.educator !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this course' });
        }

        if (!Array.isArray(courseContent)) {
            return res.status(400).json({ success: false, message: 'courseContent must be an array' });
        }

        course.courseContent = courseContent;
        await course.save();

        res.status(200).json({
            success: true,
            message: 'Course content updated successfully',
            course,
        });
    } catch (error) {
        console.error('Error updating course content:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Reorder sections and lectures (drag and drop)
const reorderContent = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id } = req.params;
        const { courseContent } = req.body;

        const course = await Course.findById(id);

        if (!course) {
            return res.status(404).json({ success: false, message: 'Course not found' });
        }

        if (course.educator !== userId) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Update order values
        courseContent.forEach((section, sIdx) => {
            section.chapterOrder = sIdx + 1;
            if (section.chapterContent) {
                section.chapterContent.forEach((lecture, lIdx) => {
                    lecture.lectureOrder = lIdx + 1;
                });
            }
        });

        course.courseContent = courseContent;
        await course.save();

        res.status(200).json({
            success: true,
            message: 'Content reordered successfully',
            course,
        });
    } catch (error) {
        console.error('Error reordering content:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a section
const deleteSection = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id, sectionId } = req.params;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.educator !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

        course.courseContent = course.courseContent.filter(ch => ch.chapterId !== sectionId);

        // Re-order remaining sections
        course.courseContent.forEach((ch, idx) => {
            ch.chapterOrder = idx + 1;
        });

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Section deleted successfully',
            course,
        });
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a lecture from a section
const deleteLecture = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id, sectionId, lectureId } = req.params;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.educator !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

        const section = course.courseContent.find(ch => ch.chapterId === sectionId);
        if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

        section.chapterContent = section.chapterContent.filter(lec => lec.lectureId !== lectureId);

        // Re-order remaining lectures
        section.chapterContent.forEach((lec, idx) => {
            lec.lectureOrder = idx + 1;
        });

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Lecture deleted successfully',
            course,
        });
    } catch (error) {
        console.error('Error deleting lecture:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a section title
const updateSection = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id, sectionId } = req.params;
        const { chapterTitle } = req.body;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.educator !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

        const section = course.courseContent.find(ch => ch.chapterId === sectionId);
        if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

        if (chapterTitle) section.chapterTitle = chapterTitle;
        await course.save();

        res.status(200).json({
            success: true,
            message: 'Section updated successfully',
            course,
        });
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update a lecture
const updateLecture = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { id, sectionId, lectureId } = req.params;
        const updates = req.body;

        const course = await Course.findById(id);
        if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
        if (course.educator !== userId) return res.status(403).json({ success: false, message: 'Not authorized' });

        const section = course.courseContent.find(ch => ch.chapterId === sectionId);
        if (!section) return res.status(404).json({ success: false, message: 'Section not found' });

        const lecture = section.chapterContent.find(lec => lec.lectureId === lectureId);
        if (!lecture) return res.status(404).json({ success: false, message: 'Lecture not found' });

        // Update allowed fields
        const allowedFields = ['lectureTitle', 'lectureDescription', 'lectureDuration', 'lectureUrl', 'lecturePdf', 'isPreviewFree'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                lecture[field] = updates[field];
            }
        });

        await course.save();

        res.status(200).json({
            success: true,
            message: 'Lecture updated successfully',
            course,
        });
    } catch (error) {
        console.error('Error updating lecture:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
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
    updateCourseContent,
    reorderContent,
    deleteSection,
    deleteLecture,
    updateSection,
    updateLecture,
};

