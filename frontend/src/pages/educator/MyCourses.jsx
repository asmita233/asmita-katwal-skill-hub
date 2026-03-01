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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-gray-500 font-medium">Fetching your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between bg-white p-8 rounded-[40px] border border-gray-50 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Master Catalog</h1>
          <p className="text-gray-500 mt-1 font-medium">You have {courses.length} published courses.</p>
        </div>
        <button
          onClick={() => navigate('/educator/add-course')}
          className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[20px] font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-200 flex items-center gap-3"
        >
          <div className="w-6 h-6 bg-white/10 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
          </div>
          Create New Course
        </button>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Course Details</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Total Revenue</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Students</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {courses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-24 h-16 rounded-2xl overflow-hidden shadow-sm relative group-hover:scale-105 transition-transform">
                        <img
                          src={course.courseThumbnail || '/placeholder.png'}
                          className="w-full h-full object-cover"
                          alt=""
                        />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{course.courseTitle}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">ID: {course._id.substring(0, 6)}</span>
                          <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">{course.category || 'General'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-gray-900">{currency}{course.enrolledStudents.length * course.coursePrice}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{currency}{course.coursePrice} per unit</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex -space-x-2">
                        {[1].map(i => (
                          <div key={i} className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-purple-600">U</div>
                        ))}
                      </div>
                      <span className="text-sm font-bold text-gray-700">{course.enrolledStudents.length} Students</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-4">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={course.isPublished}
                            onChange={() => togglePublishStatus(course._id, course.isPublished)}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${course.isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {course.isPublished ? 'Live' : 'Draft'}
                        </span>
                      </div>

                      <div className="h-4 w-[1px] bg-gray-100 mx-1"></div>

                      <button
                        onClick={() => navigate(`/course-details/${course._id}`)}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-all group/view"
                        title="View Course Details"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover/view:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {courses.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your catalog is empty</h3>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">Start your teaching journey by creating your first course. It only takes a few minutes.</p>
            <button
              onClick={() => navigate('/educator/add-course')}
              className="mt-8 px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-[20px] font-bold text-sm transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
