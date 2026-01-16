import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { currency, backendUrl, getToken } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + '/api/courses/educator/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setDashboardData(data);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Courses */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <img src={assets.appointments_icon} alt="courses" className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Courses</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {dashboardData?.totalCourses || 0}
            </h3>
          </div>
        </div>

        {/* Total Earnings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <img src={assets.earning_icon} alt="earnings" className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Earnings</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {currency}{dashboardData?.totalEarnings?.toFixed(2) || '0.00'}
            </h3>
          </div>
        </div>

        {/* Total Students */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <img src={assets.patients_icon} alt="students" className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Students</p>
            <h3 className="text-2xl font-bold text-gray-800">
              {dashboardData?.totalStudents || 0}
            </h3>
          </div>
        </div>
      </div>

      {/* Latest Enrollments */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">Latest Enrollments</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dashboardData?.enrolledStudentsData?.slice(0, 7).map((enrollment, index) => (
                <tr key={index} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <img
                        src={enrollment.student.imageUrl}
                        alt={enrollment.student.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm font-medium text-gray-800">
                        {enrollment.student.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {enrollment.courseTitle}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(enrollment.purchaseDate || new Date())}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(!dashboardData?.enrolledStudentsData || dashboardData.enrolledStudentsData.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            <p>No enrollments yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
