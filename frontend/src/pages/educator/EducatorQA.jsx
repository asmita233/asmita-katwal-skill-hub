import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EducatorQA = () => {
    const { backendUrl, getToken, user } = useContext(AppContext);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [replyText, setReplyText] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const fetchInstructorQuestions = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/questions/instructor/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setQuestions(data.questions);
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            toast.error('Failed to load questions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchInstructorQuestions();
    }, [user]);

    const handleReply = async (questionId) => {
        const text = replyText[questionId];
        if (!text?.trim()) return;

        setSubmitting(true);
        try {
            const token = await getToken();
            const { data } = await axios.post(
                `${backendUrl}/api/questions/${questionId}/answer`,
                { answer: text },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success('Reply sent!');
                setReplyText({ ...replyText, [questionId]: '' });
                fetchInstructorQuestions();
            }
        } catch (error) {
            toast.error('Failed to send reply');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading Questions...</div>;

    return (
        <div className="p-4 md:p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Student Questions (Q&A)</h1>

            <div className="space-y-6">
                {questions.length > 0 ? (
                    questions.map((q) => (
                        <div key={q._id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <img src={q.userImage || '/default-avatar.png'} className="w-10 h-10 rounded-full" alt="" />
                                    <div>
                                        <p className="font-semibold text-gray-800">{q.userName}</p>
                                        <p className="text-xs text-gray-500">Course: <span className="text-blue-600">{q.courseTitle}</span></p>
                                    </div>
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${q.isResolved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {q.isResolved ? 'Resolved' : 'Pending'}
                                </span>
                            </div>

                            <p className="text-gray-700 mb-4 bg-gray-50 p-4 rounded-lg italic">"{q.question}"</p>

                            <div className="space-y-3 mb-4">
                                {q.answers?.map((ans, idx) => (
                                    <div key={idx} className={`pl-4 border-l-2 ${ans.isInstructor ? 'border-purple-400' : 'border-gray-200'}`}>
                                        <p className="text-sm font-medium text-gray-600">{ans.userName} {ans.isInstructor && '(You)'}</p>
                                        <p className="text-sm text-gray-700">{ans.answer}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Type your response..."
                                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={replyText[q._id] || ''}
                                    onChange={(e) => setReplyText({ ...replyText, [q._id]: e.target.value })}
                                />
                                <button
                                    onClick={() => handleReply(q._id)}
                                    disabled={submitting}
                                    className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                                >
                                    Reply
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">No questions from students yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EducatorQA;
