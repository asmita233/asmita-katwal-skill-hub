const { generateCertificate, checkCertificateEligibility } = require('../controllers/certificateController');
const Certificate = require('../models/Certificate');
const Course = require('../models/Course');
const User = require('../models/User');

// Mock dependencies
jest.mock('../models/Certificate');
jest.mock('../models/Course');
jest.mock('../models/User');
jest.mock('../utils/userUtils');

describe('Certificate Controller Unit Tests (Chunk-wise)', () => {
    let req, res;

    beforeEach(() => {
        req = {
            auth: { userId: 'user_123' },
            body: { courseId: 'course_123' },
            params: { courseId: 'course_123' }
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('generateCertificate - Logic Flow', () => {
        test('Scenario: Should fail if course completion is less than 100% (Progress Chunk)', async () => {
            const mockUser = {
                _id: 'user_123',
                name: 'John Doe',
                enrolledCourses: [{
                    courseId: 'course_123',
                    progress: { completedLectures: ['l1'] }
                }]
            };
            const mockCourse = {
                _id: 'course_123',
                courseTitle: 'Node.js Basics',
                courseContent: [
                    { chapterContent: [{ lectureId: 'l1' }, { lectureId: 'l2' }] }
                ]
            };

            User.findById.mockResolvedValue(mockUser);
            Course.findById.mockResolvedValue(mockCourse);

            await generateCertificate(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: expect.stringContaining('Course completion is 50%')
            }));
        });

        test('Scenario: Should successfully create certificate if 100% complete (Creation Chunk)', async () => {
            const mockUser = {
                _id: 'user_123',
                name: 'John Doe',
                enrolledCourses: [{
                    courseId: 'course_123',
                    progress: { completedLectures: ['l1', 'l2'] }
                }]
            };
            const mockCourse = {
                _id: 'course_123',
                courseTitle: 'Node.js Basics',
                courseContent: [
                    { chapterContent: [{ lectureId: 'l1' }, { lectureId: 'l2' }] }
                ]
            };

            User.findById.mockResolvedValue(mockUser);
            Course.findById.mockResolvedValue(mockCourse);
            Certificate.findOne.mockResolvedValue(null);
            
            // Mock constructor-like behavior for "new Certificate"
            const saveMock = jest.fn().mockResolvedValue(true);
            Certificate.mockImplementation(() => ({
                save: saveMock,
                userId: 'user_123',
                courseId: 'course_123'
            }));

            await generateCertificate(req, res);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: 'Certificate generated successfully'
            }));
        });

        test('Scenario: Should return 403 if user not enrolled (Enrolment Chunk)', async () => {
            const mockUser = {
                _id: 'user_123',
                enrolledCourses: [] // Empty = not enrolled
            };
            const mockCourse = { _id: 'course_123' };

            User.findById.mockResolvedValue(mockUser);
            Course.findById.mockResolvedValue(mockCourse);

            await generateCertificate(req, res);

            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'You are not enrolled in this course'
            }));
        });
    });

    describe('checkCertificateEligibility - Logic Chunk', () => {
        test('Scenario: Should report eligible: true if 100% complete', async () => {
            const mockUser = {
                enrolledCourses: [{
                    courseId: 'course_123',
                    progress: { completedLectures: ['l1'] }
                }]
            };
            const mockCourse = {
                courseContent: [{ chapterContent: [{ lectureId: 'l1' }] }]
            };

            User.findById.mockResolvedValue(mockUser);
            Course.findById.mockResolvedValue(mockCourse);
            Certificate.findOne.mockResolvedValue(null);

            await checkCertificateEligibility(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                eligible: true,
                completionPercentage: 100
            }));
        });
    });
});
