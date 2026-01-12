import Course from '../models/Course.js';
import User from '../models/User.js';
import { v2 as cloudinary } from 'cloudinary';

// Get all courses (public)
export const getAllCourses = async (req, res) => {
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
        const query = { isPublished: true };

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
export const getCourseById = async (req, res) => {
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
export const createCourse = async (req, res) => {
    try {
        const userId = req.auth.userId;
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
            return res.status(400).json({
                success: false,
                message: 'Course title and description are required',
            });
        }

        // Create course
        const course = new Course({
            courseTitle,
            courseDescription,
            coursePrice: coursePrice || 0,
            discount: discount || 0,
            category: category || 'General',
            level: level || 'All Levels',
            courseContent: courseContent || [],
            educator: userId,
            isPublished: false,
        });

        await course.save();

        // Update user role to educator
        await User.findByIdAndUpdate(userId, { role: 'educator' });

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            course,
        });
    } catch (error) {
        console.error('Error creating course:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update course (educator only)
export const updateCourse = async (req, res) => {
    try {
        const userId = req.auth.userId;
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
export const deleteCourse = async (req, res) => {
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
export const uploadThumbnail = async (req, res) => {
    try {
        const userId = req.auth.userId;
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

// Toggle publish status
export const togglePublish = async (req, res) => {
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
export const addRating = async (req, res) => {
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
                message: 'You must be enrolled to rate this course',
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
export const getEducatorCourses = async (req, res) => {
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
export const getEducatorDashboard = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Get all courses by educator
        const courses = await Course.find({ educator: userId });

        // Calculate totals
        let totalEarnings = 0;
        let totalStudents = 0;
        const enrolledStudentsData = [];

        courses.forEach((course) => {
            const discountedPrice = course.coursePrice - (course.discount * course.coursePrice) / 100;
            totalEarnings += discountedPrice * (course.enrolledStudents?.length || 0);
            totalStudents += course.enrolledStudents?.length || 0;

            // Get student data for recent enrollments
            course.enrolledStudents?.forEach((studentId) => {
                enrolledStudentsData.push({
                    studentId,
                    courseTitle: course.courseTitle,
                    courseId: course._id,
                });
            });
        });

        // Get student details for recent enrollments
        const recentEnrollments = await Promise.all(
            enrolledStudentsData.slice(0, 10).map(async (enrollment) => {
                const student = await User.findById(enrollment.studentId).select('name imageUrl');
                return {
                    student: student || { name: 'Unknown', imageUrl: '' },
                    courseTitle: enrollment.courseTitle,
                };
            })
        );

        res.status(200).json({
            success: true,
            totalEarnings,
            totalCourses: courses.length,
            totalStudents,
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
export const getEnrolledStudents = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Get all courses by educator
        const courses = await Course.find({ educator: userId });

        const enrollmentsData = [];

        for (const course of courses) {
            for (const studentId of course.enrolledStudents || []) {
                const student = await User.findById(studentId).select('name imageUrl email');
                if (student) {
                    enrollmentsData.push({
                        student: {
                            _id: studentId,
                            name: student.name,
                            imageUrl: student.imageUrl,
                        },
                        courseTitle: course.courseTitle,
                        purchaseDate: student.enrolledCourses?.find(
                            (ec) => ec.courseId.toString() === course._id.toString()
                        )?.enrolledAt || new Date(),
                    });
                }
            }
        }

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
