import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const QASection = ({ courseId, lectureId, chapterId }) => {
    // Shared authentication context
    const { backendUrl, getToken, user } = useContext(AppContext);

    // UI State for managing discussion threads
    const [questions, setQuestions] = useState([]); // Array of question objects with nested answers
    const [newQuestion, setNewQuestion] = useState(''); // Text for a brand new question thread
    const [replyingTo, setReplyingTo] = useState(null); // ID of the question currently being replied to
    const [replyText, setReplyText] = useState(''); // Buffer for a reply/answer
    const [loading, setLoading] = useState(true); // Initial fetch state
    const [submitting, setSubmitting] = useState(false); // Action state logic

    /**
     * Retrieve discussion data from backend. 
     * Can fetch for a specific lecture or the entire course broad discussion.
     */
    const fetchQuestions = async () => {
        try {
            let url = `${backendUrl}/api/questions/course/${courseId}`;
            
            if (chapterId) {
                url = `${backendUrl}/api/questions/course/${courseId}/chapter/${chapterId}`;
            } else if (lectureId) {
                url = `${backendUrl}/api/questions/course/${courseId}/lecture/${lectureId}`;
            }
            
            const { data } = await axios.get(url);
            if (data.success) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Refetch when the student navigates to a different lecture or chapter in the player
    useEffect(() => {
        fetchQuestions();
    }, [courseId, lectureId, chapterId]);

    /**
     * POST a new question thread to the database
     */
    const handleAskQuestion = async (e) => {
        e.preventDefault();
        if (!newQuestion.trim()) return;

        setSubmitting(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/questions`,
                { courseId, lectureId, chapterId, question: newQuestion },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Question submitted!');
                setNewQuestion('');
                fetchQuestions(); // Sync list with backend immediately
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit question');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * POST a reply (answer) to an existing question thread
     */
    const handleSubmitReply = async (questionId) => {
        if (!replyText.trim()) return;

        setSubmitting(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/questions/${questionId}/answer`,
                { answer: replyText },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Reply submitted!');
                setReplyText('');
                setReplyingTo(null); // Close the reply box
                fetchQuestions();
            }
        } catch (error) {
            toast.error('Failed to submit reply');
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Toggle the "Resolved" status of a question (visually changes border and hides certain buttons)
     */
    const handleResolve = async (questionId) => {
        try {
            const token = await getToken();
            const { data } = await axios.patch(
                `${backendUrl}/api/questions/${questionId}/resolve`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Question marked as resolved');
                fetchQuestions();
            }
        } catch (error) {
            toast.error('Failed to resolve question');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Q&A Discussion</span>
                    <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded ml-1">
                        {chapterId ? 'Section Wise' : 'Topic Wide'}
                    </span>
                </div>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    {questions.length} questions
                </span>
            </h3>

            {/* --- Ask New Question Section (Authenticated Only) --- */}
            {user && (
                <form onSubmit={handleAskQuestion} className="mb-6">
                    <div className="flex gap-3">
                        <img
                            src={user.imageUrl || '/default-avatar.png'}
                            alt=""
                            className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                            <textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Ask a question about this lecture..."
                                className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows="3"
                            />
                            <div className="flex justify-end mt-2">
                                <button
                                    type="submit"
                                    disabled={submitting || !newQuestion.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    {submitting ? 'Posting...' : 'Post Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {/* --- Render Existing Threads --- */}
            <div className="space-y-4">
                {questions.length > 0 ? (
                    questions.map((q) => (
                        <div key={q._id} className={`border rounded-lg p-4 ${q.isResolved ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>

                            {/* Individual Question UI */}
                            <div className="flex gap-3">
                                <img
                                    src={q.userImage || '/default-avatar.png'}
                                    alt=""
                                    className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-gray-800">{q.userName}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(q.createdAt).toLocaleDateString()}
                                        </span>
                                        {/* Status badge */}
                                        {q.isResolved && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                Resolved
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-700">{q.question}</p>

                                    {/* Action Buttons: Reply Toggle and Resolve Checkmark */}
                                    <div className="flex items-center gap-3 mt-2">
                                        <button
                                            onClick={() => setReplyingTo(replyingTo === q._id ? null : q._id)}
                                            className="text-sm text-blue-600 hover:underline"
                                        >
                                            Reply ({q.answers?.length || 0})
                                        </button>
                                        {/* Logic: Only the original poster (student) or instructor can mark as resolved */}
                                        {!q.isResolved && user && (q.userId === user.id) && (
                                            <button
                                                onClick={() => handleResolve(q._id)}
                                                className="text-sm text-green-600 hover:underline"
                                            >
                                                Mark as Resolved
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* --- Render Nested Answers (Replies) --- */}
                            {q.answers?.length > 0 && (
                                <div className="ml-12 mt-4 space-y-3 border-l-2 border-gray-100 pl-4">
                                    {q.answers.map((answer, idx) => (
                                        <div key={idx} className="flex gap-3">
                                            <img
                                                src={answer.userImage || '/default-avatar.png'}
                                                alt=""
                                                className="w-8 h-8 rounded-full"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-800 text-sm">{answer.userName}</span>
                                                    {/* Badge to visually identify instructor replies */}
                                                    {answer.isInstructor && (
                                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                            Instructor
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(answer.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-600 text-sm">{answer.answer}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* --- Inline Reply Form (Shown when Toggle is Active) --- */}
                            {replyingTo === q._id && user && (
                                <div className="ml-12 mt-4 flex gap-3">
                                    <img
                                        src={user.imageUrl || '/default-avatar.png'}
                                        alt=""
                                        className="w-8 h-8 rounded-full"
                                    />
                                    <div className="flex-1">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder="Write your reply..."
                                            className="w-full p-2 border border-gray-200 rounded-lg resize-none text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            rows="2"
                                        />
                                        <div className="flex justify-end gap-2 mt-2">
                                            <button
                                                onClick={() => {
                                                    setReplyingTo(null);
                                                    setReplyText('');
                                                }}
                                                className="px-3 py-1.5 text-gray-600 text-sm hover:bg-gray-100 rounded-lg transition"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSubmitReply(q._id)}
                                                disabled={submitting || !replyText.trim()}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                                            >
                                                {submitting ? 'Posting...' : 'Reply'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    /* Display when discussion is dead */
                    <div className="text-center py-8 text-gray-500">
                        <p>No questions yet. Be the first to ask!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QASection;
