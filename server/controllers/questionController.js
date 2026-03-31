import Question from '../models/Question.js';
import Course from '../models/Course.js';
import User from '../models/User.js';

// Get all questions for a course
export const getCourseQuestions = async (req, res) => {
    try {
        const { courseId } = req.params;

        const questions = await Question.find({ courseId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            questions,
        });
    } catch (error) {
        console.error('Error getting questions:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get questions for a specific lecture (topic wise)
export const getLectureQuestions = async (req, res) => {
    try {
        const { courseId, lectureId } = req.params;

        const questions = await Question.find({ courseId, lectureId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            questions,
        });
    } catch (error) {
        console.error('Error getting lecture questions:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get questions for a specific chapter (section wise)
export const getChapterQuestions = async (req, res) => {
    try {
        const { courseId, chapterId } = req.params;

        const questions = await Question.find({ courseId, chapterId })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            questions,
        });
    } catch (error) {
        console.error('Error getting chapter questions:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Ask a question
export const askQuestion = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { courseId, lectureId, question } = req.body;

        // Validate
        if (!question || !courseId) {
            return res.status(400).json({
                success: false,
                message: 'Course ID and question are required',
            });
        }

        // Check if user is enrolled
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({
                success: false,
                message: 'Course not found',
            });
        }

        if (!course.enrolledStudents.includes(userId) && course.educator !== userId) {
            return res.status(403).json({
                success: false,
                message: 'You must be enrolled to ask questions',
            });
        }

        // Get user info
        const user = await User.findById(userId);

        const newQuestion = new Question({
            courseId,
            lectureId: req.body.lectureId || '',
            chapterId: req.body.chapterId || '',
            userId,
            userName: user?.name || 'Student',
            userImage: user?.imageUrl || '',
            question,
        });

        await newQuestion.save();

        res.status(201).json({
            success: true,
            message: 'Question submitted successfully',
            question: newQuestion,
        });
    } catch (error) {
        console.error('Error asking question:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Answer a question (instructor or student)
export const answerQuestion = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { questionId } = req.params;
        const { answer } = req.body;

        if (!answer) {
            return res.status(400).json({
                success: false,
                message: 'Answer is required',
            });
        }

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        // Get course to check if user is instructor
        const course = await Course.findById(question.courseId);
        const isInstructor = course?.educator === userId;

        // Get user info
        const user = await User.findById(userId);

        question.answers.push({
            userId,
            userName: user?.name || 'User',
            userImage: user?.imageUrl || '',
            answer,
            isInstructor,
        });

        await question.save();

        res.status(200).json({
            success: true,
            message: 'Answer submitted successfully',
            question,
        });
    } catch (error) {
        console.error('Error answering question:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Mark question as resolved
export const resolveQuestion = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { questionId } = req.params;

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        // Only the question author or instructor can resolve
        const course = await Course.findById(question.courseId);
        const isInstructor = course?.educator === userId;

        if (question.userId !== userId && !isInstructor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to resolve this question',
            });
        }

        question.isResolved = true;
        await question.save();

        res.status(200).json({
            success: true,
            message: 'Question marked as resolved',
            question,
        });
    } catch (error) {
        console.error('Error resolving question:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete a question (author or instructor)
export const deleteQuestion = async (req, res) => {
    try {
        const userId = req.auth?.userId;
        const { questionId } = req.params;

        const question = await Question.findById(questionId);

        if (!question) {
            return res.status(404).json({
                success: false,
                message: 'Question not found',
            });
        }

        // Only the question author or instructor can delete
        const course = await Course.findById(question.courseId);
        const isInstructor = course?.educator === userId;

        if (question.userId !== userId && !isInstructor) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this question',
            });
        }

        await Question.findByIdAndDelete(questionId);

        res.status(200).json({
            success: true,
            message: 'Question deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting question:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get instructor's Q&A (all questions for their courses)
export const getInstructorQuestions = async (req, res) => {
    try {
        const userId = req.auth?.userId;

        // Get all courses by this instructor
        const courses = await Course.find({ educator: userId }).select('_id courseTitle courseThumbnail');
        const courseIds = courses.map(c => c._id);

        // Get all questions for these courses
        const questions = await Question.find({ courseId: { $in: courseIds } })
            .sort({ createdAt: -1 });

        // Add course title to each question
        const questionsWithCourse = questions.map(q => {
            const course = courses.find(c => c._id.toString() === q.courseId.toString());
            return {
                ...q.toObject(),
                courseTitle: course?.courseTitle || 'Unknown Course',
                courseThumbnail: course?.courseThumbnail || '',
            };
        });

        res.status(200).json({
            success: true,
            questions: questionsWithCourse,
        });
    } catch (error) {
        console.error('Error getting instructor questions:', error);
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
