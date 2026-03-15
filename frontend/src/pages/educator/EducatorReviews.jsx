import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const EducatorReviews = () => {
    const { backendUrl, getToken } = useContext(AppContext);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('all');

    // Fetch all educator courses (which include courseRatings)
    const fetchCoursesWithReviews = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/courses/educator/my-courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setCourses(data.courses);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Error fetching courses:', error);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCoursesWithReviews();
    }, []);

    // Calculate aggregate stats
    const allReviews = courses.flatMap(course =>
        (course.courseRatings || []).map(review => ({
            ...review,
            courseTitle: course.courseTitle,
            courseId: course._id,
            courseThumbnail: course.courseThumbnail
        }))
    );

    const filteredReviews = selectedCourse === 'all'
        ? allReviews
        : allReviews.filter(r => r.courseId === selectedCourse);

    const totalReviews = allReviews.length;
    const averageRating = totalReviews > 0
        ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
        : 0;

    // Rating distribution (how many 5-star, 4-star, etc.)
    const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: allReviews.filter(r => r.rating === star).length,
        percentage: totalReviews > 0
            ? Math.round((allReviews.filter(r => r.rating === star).length / totalReviews) * 100)
            : 0 
    }));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Reviews & Ratings</h1>
                <p className="text-gray-500 mt-2">See what your students are saying about your courses</p>
            </div>

            {/* Aggregate Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Overall Rating Card */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{averageRating}</p>
                            <p className="text-sm text-gray-500">Average Rating</p>
                        </div>
                    </div>
                </div>

                {/* Total Reviews Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">{totalReviews}</p>
                            <p className="text-sm text-gray-500">Total Reviews</p>
                        </div>
                    </div>
                </div>

                {/* Courses Reviewed Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900">
                                {courses.filter(c => c.courseRatings?.length > 0).length}
                            </p>
                            <p className="text-sm text-gray-500">Courses Reviewed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Distribution + Course Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Rating Distribution Bar Chart */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Rating Distribution</h3>
                    <div className="space-y-3">
                        {ratingDistribution.map(({ star, count, percentage }) => (
                            <div key={star} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-600 w-12">{star} star</span>
                                <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-yellow-400 to-orange-400"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-500 w-16 text-right">{count} ({percentage}%)</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Course Filter */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Course</h3>
                    <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all text-sm"
                    >
                        <option value="all">All Courses ({totalReviews} reviews)</option>
                        {courses.map(course => (
                            <option key={course._id} value={course._id}>
                                {course.courseTitle} ({course.courseRatings?.length || 0} reviews)
                            </option>
                        ))}
                    </select>

                    {/* Per-course rating summary */}
                    <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                        {courses.filter(c => c.courseRatings?.length > 0).map(course => {
                            const courseAvg = (course.courseRatings.reduce((s, r) => s + r.rating, 0) / course.courseRatings.length).toFixed(1);
                            return (
                                <div
                                    key={course._id}
                                    onClick={() => setSelectedCourse(course._id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedCourse === course._id
                                            ? 'bg-purple-50 border border-purple-200'
                                            : 'hover:bg-gray-50 border border-transparent'
                                        }`}
                                >
                                    <img
                                        src={course.courseThumbnail}
                                        alt=""
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">{course.courseTitle}</p>
                                        <div className="flex items-center gap-1">
                                            <svg className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                            <span className="text-xs text-gray-500">{courseAvg} • {course.courseRatings.length} reviews</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Individual Reviews List */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    {selectedCourse === 'all' ? 'All Reviews' : 'Course Reviews'} ({filteredReviews.length})
                </h3>

                {filteredReviews.length > 0 ? (
                    <div className="space-y-4">
                        {filteredReviews
                            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                            .map((review, index) => (
                                <div
                                    key={index}
                                    className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            {/* Course Badge */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-xs bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full font-medium">
                                                    {review.courseTitle}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>

                                            {/* Stars */}
                                            <div className="flex items-center gap-1 mb-2">
                                                {[...Array(5)].map((_, i) => (
                                                    <svg
                                                        key={i}
                                                        className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                                        fill="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                                    </svg>
                                                ))}
                                                <span className="text-sm font-medium text-gray-600 ml-1">{review.rating}/5</span>
                                            </div>

                                            {/* Review Text */}
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                {review.review ? (
                                                    <span className="italic">"{review.review}"</span>
                                                ) : (
                                                    <span className="text-gray-400 italic">No written review</span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Rating Badge */}
                                        <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg ${review.rating >= 4 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                                                review.rating >= 3 ? 'bg-gradient-to-br from-yellow-400 to-orange-400' :
                                                    'bg-gradient-to-br from-red-400 to-rose-500'
                                            }`}>
                                            {review.rating}
                                        </div>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
                        <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-600 mb-1">No Reviews Yet</h3>
                        <p className="text-gray-400 text-sm">Reviews from students will appear here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EducatorReviews;
