import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Footer from '../../components/students/Footer';
import { Line } from 'rc-progress';
import API_BASE_URL from '../../utils/api';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyEnrollment = () => {
  // Destructure global state and utility functions from AppContext
  const {
    
    getToken,
    navigate,
    calculateRating,
    user,
    enrolledCourses,
    isEducator,
    calculateCourseDuration,
    calculateNoOfLectures
  } = useContext(AppContext);

  // Track loading status for specific course certificate generations independently
  const [loadingMap, setLoadingMap] = useState({});

  const handleThumbnailError = (event) => {
    event.currentTarget.src = '/course-placeholder.svg';
    event.currentTarget.onerror = null;
  };

  /**
   * Trigger backend API to generate a course completion certificate
   * @param {Event} e - React Synthetic Event
   * @param {string} courseId - ID of the completed course
   */
  const handleGenerateCertificate = async (e, courseId) => {
    e.stopPropagation(); // Stop the event from bubbling up to the row click (player navigation)
    setLoadingMap(prev => ({ ...prev, [courseId]: true }));
    try {
      const token = await getToken();
      const { data } = await axios.post(`${API_BASE_URL}/api/certificates/generate`, { courseId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message || 'Certificate generated! Redirecting...');
        // Move to the certificates listing page after a brief delay
        setTimeout(() => navigate('/certificates'), 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error generating certificate');
    } finally {
      setLoadingMap(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Redirect Educators away from this student-only page
  useEffect(() => {
    if (user && isEducator) {
      navigate('/educator');
    }
  }, [user, isEducator, navigate]);

  // Redirect or show message if user isn't authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Please login to view your enrollments
        </h2>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          Go Home
        </button>
      </div>
    );
  }

  // If role is educator, we'll return null while the useEffect handle the redirect
  if (isEducator) return null;

  return (
    <>
      <div className="md:px-36 px-8 pt-20 min-h-screen">
        {/* Visual header for the student's dashboard */}
        <div className="py-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            My Enrollments
          </h1>
          <p className="text-gray-500 mt-2">
            Continue learning from where you left off
          </p>
        </div>

        {/* Table Layout for displaying enrolled course details */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-4 px-4 font-medium text-gray-600">Course</th>
                <th className="py-4 px-4 font-medium text-gray-600 hidden md:table-cell">
                  Duration
                </th>
                <th className="py-4 px-4 font-medium text-gray-600 hidden md:table-cell">
                  Completed
                </th>
                <th className="py-4 px-4 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {enrolledCourses?.map((enrollment, index) => {
                const course = enrollment.courseId;
                // Safety check for cases where course data might be missing
                if (!course) return null;

                // Extract metrics for progress bar calculation
                const totalLectures = calculateNoOfLectures(course);
                const completedLectures = enrollment.progress?.completedLectures?.length || 0;
                const progress = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

                return (
                  <tr
                    key={course._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/player/${course._id}`)}
                  >
                    {/* Thumbnail and Basic Title */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={course.courseThumbnail || '/course-placeholder.svg'}
                          alt={course.courseTitle}
                          className="w-16 h-12 md:w-24 md:h-16 object-cover rounded"
                          onError={handleThumbnailError}
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 text-sm md:text-base">
                            {course.courseTitle}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <img
                              src={assets.star}
                              alt="star"
                              className="w-3.5 h-3.5"
                            />
                            <span className="text-sm text-gray-500">
                              {calculateRating(course)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Total calculated time for the course */}
                    <td className="py-4 px-4 hidden md:table-cell text-gray-600">
                      {calculateCourseDuration(course)}
                    </td>

                    {/* Graphical representation of student progress */}
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-32">
                          <Line
                            percent={progress}
                            strokeWidth={4}
                            strokeColor="#3b82f6"
                            trailWidth={4}
                            trailColor="#e5e7eb"
                          />
                        </div>
                        <span className="text-sm text-gray-500">
                          {completedLectures}/{totalLectures}
                        </span>
                      </div>
                    </td>

                    {/* Conditional Action: "On Going" badge or "Get Certificate" button */}
                    <td className="py-4 px-4">
                      {progress === 100 ? (
                        <button
                          onClick={(e) => handleGenerateCertificate(e, course._id)}
                          disabled={loadingMap[course._id]}
                          className="px-4 py-1.5 rounded text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
                        >
                          {loadingMap[course._id] ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                          ) : 'Get Certificate'}
                        </button>
                      ) : (
                        <button
                          className="px-4 py-1.5 rounded text-sm font-medium bg-blue-100 text-blue-700 pointer-events-none"
                        >
                          On Going
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* UI placeholder for when the user hasn't enrolled in anything yet */}
        {enrolledCourses?.length === 0 && (
          <div className="text-center py-20">
            <img
              src={assets.upload_area}
              alt="No courses"
              className="w-24 h-24 mx-auto opacity-50 mb-4"
            />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No courses enrolled yet
            </h3>
            <p className="text-gray-500 mb-4">
              Start learning by enrolling in a course
            </p>
            <button
              onClick={() => navigate('/course-list')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
            >
              Browse Courses
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default MyEnrollment;
