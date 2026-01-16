import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyCourses = () => {
  const { currency, navigate, calculateRating, backendUrl, getToken } = useContext(AppContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyCourses = async () => {
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
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const togglePublishStatus = async (courseId, currentStatus) => {
    try {
      const token = await getToken();
      const { data } = await axios.patch(`${backendUrl}/api/courses/${courseId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success(data.message);
        setCourses((prevCourses) =>
          prevCourses.map((course) =>
            course._id === courseId
              ? { ...course, isPublished: !currentStatus }
              : course
          )
        );
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error toggling publish status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Courses</h1>
        <button
          onClick={() => navigate('/educator/add-course')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2"
        >
          <img src={assets.add_icon} alt="add" className="w-4 h-4 invert" />
          Add Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  All Courses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Earnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Online Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course) => {
                const earnings = (
                  (course.coursePrice -
                    (course.discount * course.coursePrice) / 100) *
                  (course.enrolledStudents?.length || 0)
                ).toFixed(2);

                return (
                  <tr
                    key={course._id}
                    className="hover:bg-gray-50 transition"
                  >
                    {/* Course Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={course.courseThumbnail}
                          alt={course.courseTitle}
                          className="w-20 h-14 object-cover rounded"
                        />
                        <div>
                          <h3 className="font-medium text-gray-800 text-sm">
                            {course.courseTitle}
                          </h3>
                          <div className="flex items-center gap-1 mt-1">
                            <img
                              src={assets.star}
                              alt="star"
                              className="w-3.5 h-3.5"
                            />
                            <span className="text-xs text-gray-500">
                              {calculateRating(course)} ({course.courseRatings?.length || 0} reviews)
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Earnings */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {currency}{earnings}
                    </td>

                    {/* Students */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {course.enrolledStudents?.length || 0}
                    </td>

                    {/* Online Status Toggle */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={course.isPublished}
                            onChange={() =>
                              togglePublishStatus(course._id, course.isPublished)
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                        <span className="text-xs text-gray-500">
                          {course.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {courses.length === 0 && (
          <div className="p-12 text-center">
            <img
              src={assets.upload_area}
              alt="No courses"
              className="w-16 h-16 mx-auto opacity-50 mb-4"
            />
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              No courses yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first course and start teaching
            </p>
            <button
              onClick={() => navigate('/educator/add-course')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
            >
              Create Course
            </button>
          </div>
        )}
      </div>

      {/* Pagination - for future implementation */}
      {courses.length > 0 && (
        <div className="flex items-center justify-center mt-6">
          <button className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
