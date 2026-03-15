import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const MyCourses = () => {
  const { backendUrl, getToken, currency, navigate } = useContext(AppContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  const fetchCourses = async () => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Please log in to continue');
        return;
      }
      const { data } = await axios.get(`${backendUrl}/api/courses/educator/my-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (error) {
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const confirmDelete = (course) => {
    setCourseToDelete(course);
    setShowDeleteModal(true);
  };

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setDeletingId(courseToDelete._id);
    try {
      const token = await getToken();
      if (!token) {
        toast.error('Please log in to continue');
        return;
      }
      const { data } = await axios.delete(
        `${backendUrl}/api/courses/${courseToDelete._id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (data.success) {
        toast.success('Course deleted successfully');
        setCourses(courses.filter((c) => c._id !== courseToDelete._id));
      } else {
        toast.error(data.message || 'Failed to delete course');
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Error deleting course'
      );
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setCourseToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">My Courses</h1>
        <button
          onClick={() => navigate('/educator/add-course')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
        >
          + Add New Course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
          <button
            onClick={() => navigate('/educator/add-course')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Create Your First Course
          </button>
        </div> 
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:shadow-sm transition bg-white"
            >
              {/* Thumbnail */}
              <img
                src={course.courseThumbnail || '/placeholder.png'}
                alt={course.courseTitle}
                className="w-28 h-20 object-cover rounded-lg bg-gray-100 flex-shrink-0"
              />

              {/* Course Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 truncate">
                  {course.courseTitle}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                  <span>{course.category}</span>
                  <span>•</span>
                  <span>{course.level}</span>
                  <span>•</span>
                  <span>{course.enrolledStudents?.length || 0} students</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {course.discount > 0 && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      {course.discount}% off
                    </span>
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {currency}
                    {(
                      course.coursePrice -
                      (course.coursePrice * (course.discount || 0)) / 100
                    ).toFixed(2)}
                  </span>
                  {course.discount > 0 && (
                    <span className="text-xs text-gray-400 line-through">
                      {currency}{course.coursePrice}
                    </span>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${course.isPublished
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
                  }`}
              >
                {course.isPublished ? 'Published' : 'Draft'}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate(`/course/${course._id}`)}
                  className="px-3 py-1.5 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition"
                >
                  View
                </button>
                <button
                  onClick={() => confirmDelete(course)}
                  disabled={deletingId === course._id}
                  className={`px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition ${deletingId === course._id
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                    }`}
                >
                  {deletingId === course._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && courseToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Delete Course?
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                Are you sure you want to delete
              </p>
              <p className="text-sm font-medium text-gray-700 mb-1">
                "{courseToDelete.courseTitle}"
              </p>
              {courseToDelete.enrolledStudents?.length > 0 && (
                <p className="text-xs text-red-500 mt-2 bg-red-50 px-3 py-2 rounded-lg">
                  ⚠️ This course has
                  {courseToDelete.enrolledStudents.length} enrolled student(s).
                  They will lose access.
                </p>
              )}
              <p className="text-xs text-gray-400 mt-2">
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCourseToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCourse}
                disabled={deletingId === courseToDelete?._id}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
              >
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;

