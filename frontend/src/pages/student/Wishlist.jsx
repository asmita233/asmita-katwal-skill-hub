import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/students/Footer';
import CourseCard from '../../components/students/CourseCard';

const Wishlist = () => {
    const { backendUrl, getToken, navigate, user } = useContext(AppContext);
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/user/wishlist', {
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
            const token = await getToken();
            const { data } = await axios.delete(backendUrl + `/api/user/wishlist/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                toast.success('Removed from wishlist');
                setWishlist(wishlist.filter(course => course._id !== courseId));
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            toast.error('Failed to remove from wishlist');
        }
    };

    useEffect(() => {
        if (user) {
            fetchWishlist();
        } else {
            setLoading(false);
        }
    }, [user]);

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {wishlist.map((course) => (
                                <div key={course._id} className="relative group">
                                    <CourseCard course={course} />
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFromWishlist(course._id);
                                        }}
                                        className="absolute top-4 right-4 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                                        title="Remove from wishlist"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                        </svg>
                                    </button>
                                </div>
                            ))}
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
