import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/students/Footer';
import { Line } from 'rc-progress';

const StudentDashboard = () => {
    const { backendUrl, getToken, navigate, user, enrolledCourses } = useContext(AppContext);
    const [certificates, setCertificates] = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = async () => {
        try {
            const token = await getToken();
            // Fetch certificates
            const certRes = await axios.get(backendUrl + '/api/certificates/my-certificates', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (certRes.data.success) setCertificates(certRes.data.certificates);

            // Fetch wishlist count
            const wishRes = await axios.get(backendUrl + '/api/user/wishlist', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (wishRes.data.success) setWishlistCount(wishRes.data.wishlist.length);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDashboardData();
        else setLoading(false);
    }, [user]);

    const calculateProgress = (enrollment) => {
        if (!enrollment?.courseId?.courseContent) return 0;
        let total = 0;
        enrollment.courseId.courseContent.forEach(ch => total += ch.chapterContent?.length || 0);
        const completed = enrollment.progress?.completedLectures?.length || 0;
        return total > 0 ? Math.round((completed / total) * 100) : 0;
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-3xl shadow-xl border border-gray-100 max-w-sm w-full mx-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
                    <p className="text-gray-500 mb-8">Please sign in to your student account to view your learning progress.</p>
                    <button onClick={() => navigate('/')} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition">
                        Go to Home
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                    <p className="text-gray-500 font-medium animate-pulse">Personalizing your dashboard...</p>
                </div>
            </div>
        );
    }

    const completedCourses = enrolledCourses.filter(ec => calculateProgress(ec) === 100);
    const inProgressCourses = enrolledCourses.filter(ec => {
        const progress = calculateProgress(ec);
        return progress > 0 && progress < 100;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <span className="text-blue-600 font-bold tracking-widest uppercase text-xs">Student Portal</span>
                            <h1 className="text-4xl font-black text-gray-900 mt-2">
                                Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{user.firstName || 'Learner'}</span>! 👋
                            </h1>
                            <p className="text-gray-500 mt-3 text-lg">You've completed <span className="font-bold text-gray-900">{completedCourses.length}</span> courses so far. Keep it up!</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => navigate('/course-list')} className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition shadow-lg shadow-gray-200">
                                Explore Courses
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
                        <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex flex-col justify-between h-40 group hover:bg-blue-50 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-blue-900">{enrolledCourses.length}</h3>
                                <p className="text-blue-700/70 font-medium text-sm">Learning Now</p>
                            </div>
                        </div>

                        <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 flex flex-col justify-between h-40 group hover:bg-emerald-50 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-emerald-900">{completedCourses.length}</h3>
                                <p className="text-emerald-700/70 font-medium text-sm">Completed</p>
                            </div>
                        </div>

                        <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100/50 flex flex-col justify-between h-40 group hover:bg-amber-50 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-amber-900">{certificates.length}</h3>
                                <p className="text-amber-700/70 font-medium text-sm">Certificates</p>
                            </div>
                        </div>

                        <div className="bg-rose-50/50 p-6 rounded-3xl border border-rose-100/50 flex flex-col justify-between h-40 group hover:bg-rose-50 transition-colors">
                            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-3xl font-black text-rose-900">{wishlistCount}</h3>
                                <p className="text-rose-700/70 font-medium text-sm">Wishlisted</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
                                    Continue Learning
                                </h2>
                                <button onClick={() => navigate('/my-enrollments')} className="text-sm font-bold text-blue-600 hover:text-blue-700 transition">View All</button>
                            </div>

                            {inProgressCourses.length > 0 ? (
                                <div className="grid gap-6">
                                    {inProgressCourses.slice(0, 3).map((enrollment) => {
                                        const course = enrollment.courseId;
                                        const progress = calculateProgress(enrollment);
                                        return (
                                            <div key={course._id} className="group bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                                                <div className="flex flex-col md:flex-row gap-6">
                                                    <div className="relative overflow-hidden rounded-2xl w-full md:w-48 h-32 flex-shrink-0">
                                                        <img src={course.courseThumbnail || '/placeholder.png'} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" alt="" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                                    </div>
                                                    <div className="flex-1 flex flex-col justify-between py-1">
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-600 transition-colors line-clamp-1">{course.courseTitle}</h3>
                                                            <p className="text-gray-500 text-sm mt-1">Next: {course.courseContent?.[0]?.chapterContent?.[0]?.lectureTitle || 'Resume Lesson'}</p>
                                                        </div>
                                                        <div className="mt-4">
                                                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2 uppercase tracking-tighter">
                                                                <span>Progress</span>
                                                                <span className="text-blue-600">{progress}%</span>
                                                            </div>
                                                            <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="absolute h-full bg-blue-600 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <button onClick={() => navigate(`/player/${course._id}`)} className="w-full md:w-auto px-8 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all">
                                                            Resume
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="bg-white rounded-[40px] border border-dashed border-gray-200 p-16 text-center">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Your shelf is empty!</h3>
                                    <p className="text-gray-500 mt-2 max-w-xs mx-auto">Explore our catalog and start your learning journey tonight.</p>
                                    <button onClick={() => navigate('/course-list')} className="mt-8 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold">Discover Courses</button>
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                    <span className="w-2 h-8 bg-emerald-500 rounded-full"></span>
                                    Learning Rewards
                                </h2>
                                <button onClick={() => navigate('/certificates')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition">View Rewards</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {certificates.length > 0 ? certificates.slice(0, 4).map((cert) => (
                                    <div key={cert._id} className="p-6 bg-gradient-to-br from-white to-emerald-50/30 rounded-3xl border border-emerald-100 shadow-sm relative overflow-hidden group">
                                        <div className="absolute -right-4 -bottom-4 opacity-[0.05] group-hover:scale-125 transition-transform duration-700">
                                            <svg className="w-32 h-32 text-emerald-900" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                                        </div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
                                            </div>
                                            <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Certificate</span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 leading-tight">{cert.courseTitle}</h3>
                                        <p className="text-xs text-gray-400 mt-2 font-medium italic">Unlocked {new Date(cert.completionDate).toLocaleDateString()}</p>
                                    </div>
                                )) : (
                                    <div className="col-span-2 p-8 bg-white rounded-3xl border border-gray-100 flex flex-col items-center justify-center text-center">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4">
                                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        </div>
                                        <p className="text-gray-400 font-medium text-sm">Finish your first course to earn a certificate.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="space-y-8">
                        <div className="bg-white rounded-[40px] p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16"></div>
                            <img src={user.imageUrl || '/default-avatar.png'} className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg object-cover mb-6 relative z-10" alt="" />
                            <h3 className="text-2xl font-black text-gray-900">{user.fullName || user.emailAddress}</h3>
                            <p className="text-gray-500 font-medium">Student Member</p>

                            <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                                <button onClick={() => navigate('/wishlist')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-rose-50 rounded-2xl transition group">
                                    <span className="font-bold text-gray-700 group-hover:text-rose-600 transition-colors">Liked Courses</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-gray-400">{wishlistCount}</span>
                                        <svg className="w-4 h-4 text-gray-400 group-hover:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </button>
                                <button onClick={() => navigate('/my-enrollments')} className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-blue-50 rounded-2xl transition group">
                                    <span className="font-bold text-gray-700 group-hover:text-blue-600 transition-colors">Course Materials</span>
                                    <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[40px] p-8 text-white shadow-xl shadow-blue-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                            </div>
                            <h4 className="text-xl font-bold leading-tight">Ready to boost your skills?</h4>
                            <p className="text-blue-100 text-sm mt-3 leading-relaxed">Join 5,000+ students learning the most in-demand skills in tech and design.</p>
                            <button onClick={() => navigate('/course-list')} className="mt-8 w-full py-3 bg-white text-blue-600 rounded-xl font-black hover:bg-blue-50 transition shadow-lg">Start Learning</button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default StudentDashboard;
