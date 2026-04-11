import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/students/Footer';
import { assets } from '../../assets/assets';
import API_BASE_URL from '../../utils/api';

const Wishlist = () => {
    const { getToken, navigate, user, currency, calculateRating, enrolledCourses, isEducator, userDataLoading } = useContext(AppContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState({});

    const getCoursePrice = (course) => {
        const discountedPrice = course.coursePrice - (course.discount * course.coursePrice) / 100;
        return discountedPrice.toFixed(2);
    };

    const isEnrolled = (courseId) => {
        return enrolledCourses?.some((enrollment) => {
            if (!enrollment || !enrollment.courseId) return false;
            const enrolledCourseId = enrollment.courseId._id || enrollment.courseId;
            return enrolledCourseId && enrolledCourseId.toString() === courseId.toString();
        });
    };

    const handleThumbnailError = (event) => {
        event.currentTarget.src = '/course-placeholder.svg';
        event.currentTarget.onerror = null;
    };

    const fetchWishlist = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${API_BASE_URL}/api/user/wishlist`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setWishlist(data.wishlist);
            }
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = async (courseId) => {
        try {
            setActionLoading((prev) => ({ ...prev, [courseId]: true }));
            const token = await getToken();
            const { data } = await axios.delete(`${API_BASE_URL}/api/user/wishlist/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                toast.success('Removed from wishlist');
                setWishlist(wishlist.filter(course => course._id !== courseId));
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist');
        } finally {
            setActionLoading((prev) => ({ ...prev, [courseId]: false }));
        }
    };

    const enrollNow = async (course) => {
        if (isEnrolled(course._id)) {
            navigate(`/player/${course._id}`);
            return;
        }

        try {
            setActionLoading((prev) => ({ ...prev, [course._id]: true }));
            const token = await getToken();
            const { data } = await axios.post(
                `${API_BASE_URL}/api/payment/create-checkout-session`,
                { courseId: course._id },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (data.success) {
                if (data.isFree) {
                    toast.success('Successfully enrolled in free course!');
                    navigate(`/player/${course._id}`);
                } else {
                    window.location.href = data.url;
                }
            } else {
                toast.error(data.message || 'Failed to start checkout');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to start checkout');
        } finally {
            setActionLoading((prev) => ({ ...prev, [course._id]: false }));
        }
    };

    useEffect(() => {
        if (userDataLoading) return;
        if (user) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [user, userDataLoading]);

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in to view your wishlist</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8 lg:px-16">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Wishlist</h1>
                        <p className="text-gray-600">
                            {wishlist.length} {wishlist.length === 1 ? 'course' : 'courses'} saved for later
                        </p>
                    </div>

                    {/* Wishlist Grid */}
                    {wishlist.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {wishlist.map((course) => {
                                const rating = calculateRating(course);
                                const coursePrice = getCoursePrice(course);
                                const alreadyEnrolled = isEnrolled(course._id);

                                return (
                                    <div key={course._id} className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                                        <div className="relative">
                                            <img
                                                src={course.courseThumbnail || '/course-placeholder.svg'}
                                                alt={course.courseTitle}
                                                className="w-full h-48 object-cover"
                                                onError={handleThumbnailError}
                                            />
                                            {course.discount > 0 && (
                                                <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                                    {course.discount}% OFF
                                                </span>
                                            )}
                                        </div>

                                        <div className="p-5 flex flex-col flex-1">
                                            <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">
                                                {course.courseTitle}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">Skill Hub</p>

                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-sm font-medium text-yellow-600">{rating || '0.0'}</span>
                                                <div className="flex">
                                                    {[...Array(5)].map((_, index) => (
                                                        <img
                                                            key={index}
                                                            src={index < Math.floor(rating) ? assets.star : assets.star_blank}
                                                            alt="star"
                                                            className="w-3.5 h-3.5"
                                                        />
                                                    ))}
                                                </div>
                                                <span className="text-gray-400 text-sm">
                                                    ({course.courseRatings?.length || 0})
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-4">
                                                <p className="text-xl font-bold text-gray-800">
                                                    {currency}{coursePrice}
                                                </p>
                                                {course.discount > 0 && (
                                                    <p className="text-sm text-gray-400 line-through">
                                                        {currency}{course.coursePrice}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex-1"></div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                                                <button
                                                    onClick={() => removeFromWishlist(course._id)}
                                                    disabled={actionLoading[course._id]}
                                                    className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition disabled:opacity-60"
                                                >
                                                    {actionLoading[course._id] ? 'Removing...' : 'Remove from Wishlist'}
                                                </button>
                                                <button
                                                    onClick={() => enrollNow(course)}
                                                    disabled={actionLoading[course._id]}
                                                    className={`w-full py-3 rounded-xl font-semibold text-white transition disabled:opacity-60 ${alreadyEnrolled ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                                >
                                                    {actionLoading[course._id]
                                                        ? 'Processing...'
                                                        : alreadyEnrolled
                                                            ? 'Continue Learning'
                                                            : 'Enroll Now'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Your wishlist is empty</h3>
                            <p className="text-gray-600 mb-6">Save courses to your wishlist to access them later</p>
                            <button
                                onClick={() => navigate('/course-list')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                Browse Courses
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Wishlist;
