const { 
    getAllCourses, 
    createCourse, 
    updateCourse, 
    deleteCourse,
    uploadThumbnail,
    addRating,
    deleteLecture 
} = require('../controllers/courseController');
const Course = require('../models/Course');
const User = require('../models/User');
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const { syncUserFromClerk } = require('../utils/userUtils');

// Mock dependencies
jest.mock('../models/Course');
jest.mock('../models/User');
jest.mock('../utils/userUtils');
jest.mock('fs');
jest.mock('cloudinary', () => ({
    v2: {
        uploader: {
            upload: jest.fn()
        }
    }
}));

describe('Course Controller Unit Tests (Chunk-wise)', () => {
    let req, res;

    beforeEach(() => {
        req = { 
            auth: { userId: 'educator_123' },
            body: {},
            params: {},
            query: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getAllCourses - Query Filtering Chunk', () => {
        test('Scenario: Should apply price filters correctly', async () => {
            req.query = { minPrice: '10', maxPrice: '50' };
            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue([])
            };
            Course.find.mockReturnValue(mockChain);
            Course.countDocuments.mockResolvedValue(0);

            await getAllCourses(req, res);

            expect(Course.find).toHaveBeenCalledWith(expect.objectContaining({
                coursePrice: { $gte: 10, $lte: 50 }
            }));
        });

        test('Scenario: Should handle pagination math', async () => {
            req.query = { page: '3', limit: '5' };
            const mockChain = {
                sort: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                populate: jest.fn().mockResolvedValue([])
            };
            Course.find.mockReturnValue(mockChain);
            Course.countDocuments.mockResolvedValue(20);

            await getAllCourses(req, res);

            expect(mockChain.skip).toHaveBeenCalledWith(10); // (3-1)*5 = 10
            expect(mockChain.limit).toHaveBeenCalledWith(5);
        });
    });

    describe('createCourse - Validation Chunk', () => {
        test('Scenario: Should fail if title is missing', async () => {
            req.body = { courseDescription: 'Only description' };
            await createCourse(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Course title and description are required' }));
        });

        test('Scenario: Should successfully create course and update user role', async () => {
            req.body = { courseTitle: 'New Course', courseDescription: 'Desc' };
            User.findById.mockResolvedValue({ _id: 'educator_123', role: 'student' });
            
            // Mock Course constructor behavior
            const mockSave = jest.fn().mockResolvedValue(true);
            Course.mockImplementation(() => ({
                courseTitle: 'New Course',
                _id: 'c123',
                save: mockSave
            }));

            await createCourse(req, res);

            expect(mockSave).toHaveBeenCalled();
            expect(User.findByIdAndUpdate).toHaveBeenCalledWith('educator_123', { role: 'educator' });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('updateCourse - Authorization Chunk', () => {
        test('Scenario: Should reject if user is not the owner (Guard Chunk)', async () => {
            req.params = { id: 'c1' };
            req.auth.userId = 'hacker_123';
            const mockCourse = { educator: 'educator_123', _id: 'c1' };
            Course.findById.mockResolvedValue(mockCourse);

            await updateCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorized to update this course' }));
        });

        test('Scenario: Should update course if user is owner', async () => {
            req.params = { id: 'c1' };
            req.body = { courseTitle: 'Updated title' };
            const mockCourse = { 
                educator: 'educator_123', 
                _id: 'c1',
                courseTitle: 'Old title',
                save: jest.fn().mockResolvedValue(true)
            };
            Course.findById.mockResolvedValue(mockCourse);

            await updateCourse(req, res);

            expect(mockCourse.courseTitle).toBe('Updated title');
            expect(mockCourse.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('deleteCourse - Cleanup Chunk', () => {
        test('Scenario: Should delete course if user is owner', async () => {
            req.params = { id: 'c1' };
            const mockCourse = { educator: 'educator_123', _id: 'c1' };
            Course.findById.mockResolvedValue(mockCourse);

            await deleteCourse(req, res);

            expect(Course.findByIdAndDelete).toHaveBeenCalledWith('c1');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Scenario: Should fail if course not found', async () => {
            req.params = { id: 'nonexistent' };
            Course.findById.mockResolvedValue(null);

            await deleteCourse(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
        });
    });

    describe('uploadThumbnail - External API Chunk', () => {
        test('Scenario: Should upload to Cloudinary and update course thumbnail', async () => {
            req.params = { id: 'c1' };
            req.file = { path: 'temp/path.jpg' };
            const mockCourse = { 
                educator: 'educator_123', 
                _id: 'c1',
                save: jest.fn().mockResolvedValue(true)
            };
            Course.findById.mockResolvedValue(mockCourse);
            cloudinary.uploader.upload.mockResolvedValue({ secure_url: 'https://cloudinary.com/new.jpg' });

            await uploadThumbnail(req, res);

            expect(cloudinary.uploader.upload).toHaveBeenCalledWith('temp/path.jpg', expect.any(Object));
            expect(mockCourse.courseThumbnail).toBe('https://cloudinary.com/new.jpg');
            expect(mockCourse.save).toHaveBeenCalled();
            expect(fs.unlinkSync).toHaveBeenCalledWith('temp/path.jpg');
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Scenario: Should fail if no file provided', async () => {
            req.file = null;
            await uploadThumbnail(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'No file uploaded' }));
        });

        test('Scenario: Should fail if user is not the owner', async () => {
            req.params = { id: 'c1' };
            req.file = { path: 'path' };
            req.auth.userId = 'hacker_123';
            const mockCourse = { educator: 'educator_123', _id: 'c1' };
            Course.findById.mockResolvedValue(mockCourse);

            await uploadThumbnail(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Not authorized' }));
        });
    });

    describe('addRating - Enrollment Chunk', () => {
        test('Scenario: Should reject rating if student not enrolled', async () => {
            req.params = { id: 'c1' };
            req.body = { rating: 5 };
            const mockCourse = { 
                enrolledStudents: ['enrolled_id'], // Current user NOT here
                courseRatings: []
            };
            Course.findById.mockResolvedValue(mockCourse);

            await addRating(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Only enrolled students can review this course' }));
        });
    });

    describe('deleteLecture - Array Manipulation Chunk', () => {
        test('Scenario: Should filter out the lecture from nested chapters', async () => {
            req.params = { id: 'c1', sectionId: 's1', lectureId: 'l1' };
            const mockCourse = { 
                educator: 'educator_123',
                courseContent: [{
                    chapterId: 's1',
                    chapterContent: [
                        { lectureId: 'l1', lectureOrder: 1 },
                        { lectureId: 'l2', lectureOrder: 2 }
                    ]
                }],
                save: jest.fn().mockResolvedValue(true)
            };
            Course.findById.mockResolvedValue(mockCourse);

            await deleteLecture(req, res);

            const remainingLectures = mockCourse.courseContent[0].chapterContent;
            expect(remainingLectures.length).toBe(1);
            expect(remainingLectures[0].lectureId).toBe('l2');
            expect(mockCourse.save).toHaveBeenCalled();
        });
    });
});
