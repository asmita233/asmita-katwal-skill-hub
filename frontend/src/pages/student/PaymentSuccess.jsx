import React, { useContext, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';
import API_BASE_URL from '../../utils/api';

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const { navigate, getToken, fetchEnrolledCourses } = useContext(AppContext);
    const [verifying, setVerifying] = useState(true);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const verifyPayment = async () => {
            if (!sessionId) {
                setVerifying(false);
                return;
            }

            try {
                const token = await getToken();
                const { data } = await axios.post(
                    `${API_BASE_URL}/api/payment/verify-payment`,
                    { sessionId },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (data.success) {
                    setSuccess(true);
                    toast.success('Payment successful! Welcome to the course.');
                    fetchEnrolledCourses();
                } else {
                    toast.error(data.message || 'Payment verification failed');
                }
            } catch (error) {
                console.error('Payment verification error:', error);
                toast.error('Failed to verify payment');
            } finally {
                setVerifying(false);
            }
        };

        verifyPayment();
    }, [sessionId]);

    if (verifying) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">Verifying your payment...</h2>
                    <p className="text-gray-500 mt-2">Please wait while we confirm your enrollment.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center">
                {success ? (
                    <>
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Successful!</h1>
                        <p className="text-gray-600 mb-8">
                            Congratulations! You have successfully enrolled in the course. Start learning now!
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/my-enrollments')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Go to My Courses
                            </button>
                            <button
                                onClick={() => navigate('/course-list')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                Browse More Courses
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-3">Payment Failed</h1>
                        <p className="text-gray-600 mb-8">
                            Something went wrong with your payment. Please try again or contact support.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <button
                                onClick={() => navigate('/course-list')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => navigate('/')}
                                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
                            >
                                Go Home
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;
