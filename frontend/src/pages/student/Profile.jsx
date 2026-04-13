import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { useUser } from '@clerk/clerk-react';
import Footer from '../../components/students/Footer';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_BASE_URL from '../../utils/api';

const Profile = () => {
    const { getToken, enrolledCourses, isEducator, navigate } = useContext(AppContext);
    const { user } = useUser();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        enrolledCount: 0,
        completedCount: 0,
        certificateCount: 0,
        wishlistCount: 0,
        // Educator stats
        totalEarnings: 0,
        totalCourses: 0,
        totalStudents: 0,
    });

    // Fetch user data and stats
    const fetchProfileData = async () => {
        try {
            const token = await getToken();

            // Fetch user data
            const { data: userRes } = await axios.get(`${API_BASE_URL}/api/user/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (userRes.success) {
                setUserData(userRes.user);

                // Standard Student Data (Now always fetched for all users)
                const enrollments = userRes.user.enrolledCourses || [];
                let completed = 0;

                for (const enrollment of enrollments) {
                    if (enrollment.courseId && enrollment.progress) {
                        const totalLectures = enrollment.courseId.totalLectures || 0;
                        const completedLectures = enrollment.progress.completedLectures?.length || 0;
                        if (totalLectures > 0 && completedLectures >= totalLectures) {
                            completed++;
                        }
                    }
                }

                setStats(prev => ({
                    ...prev,
                    enrolledCount: enrollments.length,
                    completedCount: completed,
                    wishlistCount: userRes.user.wishlist?.length || 0,
                }));

                // Fetch certificates count
                try {
                    const { data: certRes } = await axios.get(`${API_BASE_URL}/api/certificates/user`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (certRes.success) {
                        setStats(prev => ({
                            ...prev,
                            certificateCount: certRes.certificates?.length || 0,
                        }));
                    }
                } catch (e) { }

                // Fetch Educator Stats if applicable
                if (userRes.user.role === 'educator') {
                    try {
                        const { data: edRes } = await axios.get(`${API_BASE_URL}/api/courses/educator/dashboard`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (edRes.success) {
                            setStats(prev => ({
                                ...prev,
                                totalEarnings: edRes.totalEarnings,
                                totalCourses: edRes.totalCourses,
                                totalStudents: edRes.totalStudents,
                            }));
                        }
                    } catch (e) {
                        console.error('Error fetching educator stats:', e);
                    }
                }
            }

        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchProfileData();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!user || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Please login to view your profile.</p>
            </div>
        );
    }

    const memberSince = new Date(userData.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <>
            <div className="min-h-screen bg-gray-50 pt-20 pb-12">
                {/* Profile Header Section */}
                <div className="relative">
                    {/* Cover Gradient */}
                    <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-b-3xl mx-4 md:mx-auto md:max-w-4xl" />

                    {/* Profile Card */}
                    <div className="max-w-4xl mx-auto px-6 -mt-20">
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                                {/* Avatar */}
                                <div className="relative">
                                    <img
                                        src={user.imageUrl || userData.imageUrl}
                                        alt={userData.name}
                                        className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg"
                                    />
                                    <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md ${isEducator ? 'bg-purple-500' : 'bg-blue-500'
                                        }`}>
                                        {isEducator ? '🎓' : '📚'}
                                    </div>
                                </div>

                                {/* Name & Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h1 className="text-2xl font-bold text-gray-900">{userData.name}</h1>
                                    <p className="text-gray-500 mt-1">{userData.email}</p>
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isEducator
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {userData.role || 'Student'}
                                        </span>
                                        <span className="text-gray-400 text-sm flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Joined {memberSince}
                                        </span>
                                    </div>
                                </div>

                                {/* Manage Account Button */}
                                <button
                                    onClick={() => user && window.open('https://accounts.clerk.dev/user', '_blank')}
                                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Manage Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="max-w-4xl mx-auto px-6 mt-8">
                    <div className="space-y-8">
                        {isEducator && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Total Students */}
                                <div
                                    onClick={() => navigate('/educator/student-enrolled')}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                                    <p className="text-gray-500 mt-1 font-medium">Total Students</p>
                                </div>

                                {/* Total Courses */}
                                <div
                                    onClick={() => navigate('/educator/my-courses')}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{stats.totalCourses}</p>
                                    <p className="text-gray-500 mt-1 font-medium">Courses Created</p>
                                </div>

                                {/* Total Earnings */}
                                <div
                                    onClick={() => navigate('/educator')}
                                    className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">${stats.totalEarnings?.toFixed(2)}</p>
                                    <p className="text-gray-500 mt-1 font-medium">Total Earnings</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {/* Enrolled Courses */}
                            <div
                                onClick={() => navigate('/my-enrollments')}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.enrolledCount}</p>
                                <p className="text-sm text-gray-500 mt-1">Enrolled Courses</p>
                            </div>

                            {/* Completed Courses */}
                            <div
                                onClick={() => navigate('/dashboard')}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
                                <p className="text-sm text-gray-500 mt-1">Completed</p>
                            </div>

                            {/* Certificates */}
                            <div
                                onClick={() => navigate('/certificates')}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.certificateCount}</p>
                                <p className="text-sm text-gray-500 mt-1">Certificates</p>
                            </div>

                            {/* Wishlist */}
                            <div
                                onClick={() => navigate('/wishlist')}
                                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                    <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-gray-900">{stats.wishlistCount}</p>
                                <p className="text-sm text-gray-500 mt-1">Wishlist</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="max-w-4xl mx-auto px-6 mt-8">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => navigate('/course-list')}
                            className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">Browse Courses</p>
                                <p className="text-sm text-gray-500">Discover new courses</p>
                            </div>
                        </button>

                        <button
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">My Dashboard</p>
                                <p className="text-sm text-gray-500">Track your progress</p>
                            </div>
                        </button>
                        <button
                            onClick={() => navigate('/certificates')}
                            className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group text-left"
                        >
                            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">My Certificates</p>
                                <p className="text-sm text-gray-500">View achievements</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default Profile;
