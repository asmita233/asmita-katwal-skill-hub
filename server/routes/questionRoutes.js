import express from 'express';
import { requireAuth } from '@clerk/express';
import {
    getCourseQuestions,
    getLectureQuestions,
    getChapterQuestions,
    askQuestion,
    answerQuestion,
    resolveQuestion,
    deleteQuestion,
    getInstructorQuestions,
} from '../controllers/questionController.js';

const router = express.Router();

// Public routes
router.get('/course/:courseId', getCourseQuestions);
router.get('/course/:courseId/lecture/:lectureId', getLectureQuestions);
router.get('/course/:courseId/chapter/:chapterId', getChapterQuestions);

// Protected routes
router.post('/', requireAuth(), askQuestion);
router.post('/:questionId/answer', requireAuth(), answerQuestion);
router.patch('/:questionId/resolve', requireAuth(), resolveQuestion);
router.delete('/:questionId', requireAuth(), deleteQuestion);

// Instructor routes
router.get('/instructor/all', requireAuth(), getInstructorQuestions);

export default router;
