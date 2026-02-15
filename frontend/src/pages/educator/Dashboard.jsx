import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  // Shared currency configuration and authentication helper from context
  const { currency, backendUrl, getToken } = useContext(AppContext);

  // Local state for dashboard metrics (total earnings, student count, courses)
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch aggregated educator analytics from the backend
   * Includes total revenue, active course counts, and recent student activity
   */
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

  // Load analytics on component mounting
  useEffect(() => {
    fetchDashboardData();
  }, []);

  /**
   * Helper to prettify ISO date strings for UI display
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Render high-quality animated loader while awaiting API response
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Analytics Overview</h1>
        <p className="text-gray-500 mt-2">Track your course performance and student engagement.</p>
      </div>

      {/* --- Stats Cards Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* 1. Total Courses Card */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Portfolio</p>
          <h3 className="text-4xl font-black text-gray-900">{dashboardData?.totalCourses || 0}</h3>
          <p className="text-gray-500 font-medium text-sm mt-1">Active Courses</p>
        </div>

        {/* 2. Total Earnings Card (Revenue) */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg className="w-24 h-24 text-emerald-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path></svg>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Revenue</p>
          <h3 className="text-4xl font-black text-gray-900">{currency}{dashboardData?.totalEarnings?.toFixed(2) || '0.00'}</h3>
          <p className="text-gray-500 font-medium text-sm mt-1">Total Earnings</p>
        </div>

        {/* 3. Total Students Card (Community size) */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
          </div>
          <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">Community</p>
          <h3 className="text-4xl font-black text-gray-900">{dashboardData?.totalStudents || 0}</h3>
          <p className="text-gray-500 font-medium text-sm mt-1">Total Enrolled</p>
        </div>
      </div>

      {/* --- Recent Activity Table --- */}
      <div className="bg-white rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-gray-50 overflow-hidden">
        <div className="px-8 py-8 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Recent Enrollments</h2>
          <button className="text-sm font-bold text-purple-600 hover:text-purple-700 transition">View All Activity</button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Student</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Course</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dashboardData?.enrolledStudentsData?.slice(0, 7).map((enrollment, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={enrollment.student.imageUrl || assets.profile_img}
                          className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white shadow-sm"
                          alt={enrollment.student.name}
                          onError={(e) => { e.target.src = assets.profile_img }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm group-hover:text-purple-600 transition-colors">{enrollment.student.name}</p>
                        <p className="text-xs text-gray-400 font-medium">Verified Learner</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700">{enrollment.courseTitle}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 italic">Paid Enrollment</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm text-gray-500 font-medium">{formatDate(enrollment.purchaseDate || new Date())}</span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 uppercase tracking-widest">Successful</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State visual for new educators with no sales yet */}
        {(!dashboardData?.enrolledStudentsData || dashboardData.enrolledStudentsData.length === 0) && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900">No enrollments yet</h3>
            <p className="text-gray-400 mt-2 max-w-xs mx-auto">Your courses are live! Once students start enrolling, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
