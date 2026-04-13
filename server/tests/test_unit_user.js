const { 
    getUserData, 
    getEnrolledCourses,
    updateProgress, 
    addToWishlist, 
    removeFromWishlist,
    getWishlist,
    becomeEducator,
    purchaseCourse,
    clerkWebhook 
} = require('../controllers/userController');
const User = require('../models/User');
const { syncUserFromClerk } = require('../utils/userUtils');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../utils/userUtils');

describe('User Controller Unit Tests (Chunk-wise)', () => {
    let req, res;

    beforeEach(() => {
        req = { 
            auth: { userId: 'user_123' },
            body: {},
            params: {}
        };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserData Chunk', () => {
        test('Scenario: Should return 401 if no userId present (Auth Chunk)', async () => {
            req.auth = null;
            await getUserData(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
        });

        test('Scenario: Should return user from DB (Database Chunk)', async () => {
            const mockUser = { _id: 'user_123', name: 'Test User' };
            User.findById.mockResolvedValue(mockUser);
            await getUserData(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ user: mockUser }));
        });

        test('Scenario: Should sync from Clerk if missing in DB (Sync Chunk)', async () => {
            User.findById.mockResolvedValue(null);
            const mockSyncedUser = { _id: 'user_123', name: 'Synced' };
            syncUserFromClerk.mockResolvedValue(mockSyncedUser);
            await getUserData(req, res);
            expect(syncUserFromClerk).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('updateProgress Chunk', () => {
        test('Scenario: Should return 400 if course not enrolled (Validation Chunk)', async () => {
            req.body = { courseId: 'course_999', lectureId: 'lec_1' };
            const mockUser = { 
                _id: 'user_123', 
                enrolledCourses: [{ courseId: 'course_Different' }] 
            };
            User.findById.mockResolvedValue(mockUser);
            await updateProgress(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Course not enrolled' }));
        });

        test('Scenario: Should add lectureId to progress (Update Chunk)', async () => {
            req.body = { courseId: 'course_1', lectureId: 'lec_1' };
            const mockUser = { 
                _id: 'user_123', 
                enrolledCourses: [{ 
                    courseId: 'course_1', 
                    progress: { completedLectures: [] } 
                }],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            await updateProgress(req, res);
            expect(mockUser.enrolledCourses[0].progress.completedLectures).toContain('lec_1');
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('addToWishlist Chunk', () => {
        test('Scenario: Should not duplicate wishlist items (Logic Chunk)', async () => {
            req.body = { courseId: 'course_1' };
            const mockUser = { 
                _id: 'user_123', 
                wishlist: ['course_1'],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            await addToWishlist(req, res);
            expect(mockUser.wishlist.length).toBe(1); // Not changed
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getEnrolledCourses Chunk', () => {
        test('Scenario: Should return enrolled courses from DB', async () => {
            const mockUser = { 
                _id: 'user_123', 
                enrolledCourses: [{ courseId: { title: 'JS Course' } }] 
            };
            User.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUser)
            });
            await getEnrolledCourses(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ enrolledCourses: mockUser.enrolledCourses }));
        });
    });

    describe('removeFromWishlist Chunk', () => {
        test('Scenario: Should filter out the course from wishlist', async () => {
            req.params = { courseId: 'course_1' };
            const mockUser = { 
                _id: 'user_123', 
                wishlist: ['course_1', 'course_2'],
                save: jest.fn().mockResolvedValue(true)
            };
            User.findById.mockResolvedValue(mockUser);
            await removeFromWishlist(req, res);
            expect(mockUser.wishlist.length).toBe(1);
            expect(mockUser.save).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });
    });

    describe('getWishlist Chunk', () => {
        test('Scenario: Should return populated wishlist', async () => {
            const mockUser = { _id: 'user_123', wishlist: [{ title: 'C1' }] };
            User.findById.mockReturnValue({
                populate: jest.fn().mockResolvedValue(mockUser)
            });
            await getWishlist(req, res);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ wishlist: mockUser.wishlist }));
        });
    });

    describe('purchaseCourse Chunk', () => {
        test('Scenario: Should return success if user exists', async () => {
            req.body = { courseId: 'c1' };
            req.headers = { origin: 'localhost' };
            User.findById.mockResolvedValue({ _id: 'u1' });
            await purchaseCourse(req, res);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
        });
    });

    describe('clerkWebhook Chunk', () => {
        test('Scenario: Should upsert user on user.created event (Event Chunk)', async () => {
            req.body = { 
                type: 'user.created', 
                data: { id: 'new_clerk_id', email_addresses: [{ email_address: 'test@test.com' }] } 
            };
            await clerkWebhook(req, res);
            expect(User.findByIdAndUpdate).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(200);
        });

        test('Scenario: Should delete user on user.deleted event (Event Chunk)', async () => {
            req.body = { type: 'user.deleted', data: { id: 'old_clerk_id' } };
            await clerkWebhook(req, res);
            expect(User.findByIdAndDelete).toHaveBeenCalledWith('old_clerk_id');
        });
    });
});
