import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/students/Footer';
import { Line } from 'rc-progress';
import API_BASE_URL from '../../utils/api';

const StudentDashboard = () => {
    const { getToken, navigate, user, enrolledCourses, isEducator } = useContext(AppContext);
    const [certificates, setCertificates] = useState([]);
    const [wishlistCount, setWishlistCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const handleThumbnailError = (event) => {
        event.currentTarget.src = '/course-placeholder.svg';
        event.currentTarget.onerror = null;
    };

    const fetchDashboardData = async () => {
        try {
            const token = await getToken();
            // Fetch certificates
            const certRes = await axios.get(`${API_BASE_URL}/api/certificates/my-certificates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (certRes.data.success) setCertificates(certRes.data.certificates);

            // Fetch wishlist count
            const wishRes = await axios.get(`${API_BASE_URL}/api/user/wishlist`, {
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
        if (user) {
            if (isEducator) {
                navigate('/educator');
                return;
            }
            fetchDashboardData();
        }
        else setLoading(false);
    }, [user, isEducator]);

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
        <div className="min-h-screen bg-slate-50">
            <div className="border-b border-slate-200 bg-white/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 py-10">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src={user.imageUrl || '/default-avatar.png'}
                                alt=""
                                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-sm"
                            />
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">Student Dashboard</p>
                                <h1 className="mt-2 text-3xl md:text-4xl font-semibold text-slate-900">
                                    Welcome back, {user.firstName || user.fullName || 'Learner'}
                                </h1>
                                <p className="mt-2 text-slate-500 max-w-2xl">
                                    Your learning progress, certificates, and saved courses are in one clean place.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => navigate('/course-list')}
                                className="px-5 py-3 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition"
                            >
                                Explore Courses
                            </button>
                            <button
                                onClick={() => navigate('/my-enrollments')}
                                className="px-5 py-3 rounded-xl bg-white text-slate-700 font-medium border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
                            >
                                My Enrollments
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                        {[
                            { label: 'In Progress', value: inProgressCourses.length, tone: 'blue' },
                            { label: 'Completed', value: completedCourses.length, tone: 'emerald' },
                            { label: 'Certificates', value: certificates.length, tone: 'amber' },
                            { label: 'Wishlist', value: wishlistCount, tone: 'rose' },
                        ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                <p className="text-sm text-slate-500">{item.label}</p>
                                <div className={`mt-2 text-3xl font-semibold ${item.tone === 'blue' ? 'text-blue-700' : item.tone === 'emerald' ? 'text-emerald-700' : item.tone === 'amber' ? 'text-amber-700' : 'text-rose-700'}`}>
                                    {item.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Continue Learning</h2>
                                    <p className="text-sm text-slate-500 mt-1">Pick up where you left off.</p>
                                </div>
                                <button onClick={() => navigate('/my-enrollments')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                    View all
                                </button>
                            </div>

                            {inProgressCourses.length > 0 ? (
                                <div className="space-y-4">
                                    {inProgressCourses.slice(0, 3).map((enrollment) => {
                                        const course = enrollment.courseId;
                                        const progress = calculateProgress(enrollment);
                                        return (
                                            <div key={course._id} className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                                <div className="relative h-24 w-full sm:w-40 overflow-hidden rounded-xl bg-slate-100 flex-shrink-0">
                                                    <img
                                                        src={course.courseThumbnail || '/course-placeholder.svg'}
                                                        alt={course.courseTitle}
                                                        className="h-full w-full object-cover"
                                                        onError={handleThumbnailError}
                                                    />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base font-semibold text-slate-900 truncate">{course.courseTitle}</h3>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Next lesson: {course.courseContent?.[0]?.chapterContent?.[0]?.lectureTitle || 'Resume learning'}
                                                    </p>
                                                    <div className="mt-4">
                                                        <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                                                            <span>Progress</span>
                                                            <span>{progress}%</span>
                                                        </div>
                                                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                                                            <div className="h-full rounded-full bg-blue-600" style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => navigate(`/player/${course._id}`)}
                                                    className="sm:self-center px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition"
                                                >
                                                    Resume
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                                    <p className="text-slate-700 font-medium">No active courses yet.</p>
                                    <p className="text-sm text-slate-500 mt-2">Explore the catalog and start your first course.</p>
                                    <button onClick={() => navigate('/course-list')} className="mt-6 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
                                        Browse Courses
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <div className="flex items-center justify-between gap-4 mb-5">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Certificates</h2>
                                    <p className="text-sm text-slate-500 mt-1">Your completed learning milestones.</p>
                                </div>
                                <button onClick={() => navigate('/certificates')} className="text-sm font-medium text-blue-600 hover:text-blue-700">
                                    View all
                                </button>
                            </div>

                            {certificates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {certificates.slice(0, 4).map((cert) => (
                                        <div key={cert._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">Certificate</p>
                                            <h3 className="mt-3 font-semibold text-slate-900 line-clamp-2">{cert.courseTitle}</h3>
                                            <p className="mt-2 text-sm text-slate-500">
                                                Completed {new Date(cert.completionDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                                    <p className="text-slate-700 font-medium">No certificates yet.</p>
                                    <p className="text-sm text-slate-500 mt-2">Finish a course to unlock your first certificate.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    <aside className="space-y-6">
                        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-slate-900">Quick Actions</h2>
                            <div className="mt-4 space-y-3">
                                <button onClick={() => navigate('/wishlist')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition">
                                    <span className="block text-sm font-medium text-slate-900">Wishlist</span>
                                    <span className="text-xs text-slate-500">{wishlistCount} saved courses</span>
                                </button>
                                <button onClick={() => navigate('/profile')} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition">
                                    <span className="block text-sm font-medium text-slate-900">Profile</span>
                                    <span className="text-xs text-slate-500">Update your account details</span>
                                </button>
                            </div>
                        </section>

                        <section className="rounded-3xl bg-slate-900 p-6 text-white shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Next step</p>
                            <h3 className="mt-3 text-xl font-semibold">Keep moving forward</h3>
                            <p className="mt-2 text-sm text-white/70 leading-6">
                                Choose one course today and finish the next lesson.
                            </p>
                            <button onClick={() => navigate('/course-list')} className="mt-6 w-full rounded-xl bg-white px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100 transition">
                                Explore Courses
                            </button>
                        </section>
                    </aside>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default StudentDashboard;
