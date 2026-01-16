import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Footer from '../../components/students/Footer';
import { Line } from 'rc-progress';

const MyEnrollment = () => {
  const { navigate, calculateRating, currency, user, enrolledCourses, calculateCourseDuration, calculateNoOfLectures } = useContext(AppContext);

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

  return (
    <>
      <div className="md:px-36 px-8 pt-20 min-h-screen">
        {/* Page Header */}
        <div className="py-8">
          <h1 className="text-3xl font-semibold text-gray-800">
            My Enrollments
          </h1>
          <p className="text-gray-500 mt-2">
            Continue learning from where you left off
          </p>
        </div>

        {/* Enrolled Courses Table */}
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
              {enrolledCourses.map((enrollment, index) => {
                const course = enrollment.courseId;
                if (!course) return null;

                const totalLectures = calculateNoOfLectures(course);
                const completedLectures = enrollment.progress?.completedLectures?.length || 0;
                const progress = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

                return (
                  <tr
                    key={course._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => navigate(`/player/${course._id}`)}
                  >
                    {/* Course Info */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={course.courseThumbnail}
                          alt={course.courseTitle}
                          className="w-16 h-12 md:w-24 md:h-16 object-cover rounded"
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

                    {/* Duration */}
                    <td className="py-4 px-4 hidden md:table-cell text-gray-600">
                      {calculateCourseDuration(course)}
                    </td>

                    {/* Progress */}
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

                    {/* Status */}
                    <td className="py-4 px-4">
                      <button
                        className={`px-4 py-1.5 rounded text-sm font-medium ${progress === 100
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                          }`}
                      >
                        {progress === 100 ? 'Completed' : 'On Going'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {enrolledCourses.length === 0 && (
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
