import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const Sidebar = () => {
  // Hook to get current URL path for active link detection
  const location = useLocation();
  // Context to handle programmatic navigation
  const { navigate } = useContext(AppContext);

  // Configuration for the sidebar menu items
  // Each item includes a name, path, and a function that returns an SVG based on isActive state
  const menuItems = [
    {
      name: 'Dashboard',
      path: '/educator',
      icon: (isActive) => (
        <svg className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
        </svg>
      )
    },
    {
      name: 'Add Course',
      path: '/educator/add-course',
      icon: (isActive) => (
        <svg className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      )
    },
    {
      name: 'My Courses',
      path: '/educator/my-courses',
      icon: (isActive) => (
        <svg className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
      )
    },
    {
      name: 'Enrolled',
      path: '/educator/student-enrolled',
      icon: (isActive) => (
        <svg className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
        </svg>
      )
    },
    {
      name: 'Q&A Inbox',
      path: '/educator/questions',
      icon: (isActive) => (
        <svg className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
        </svg>
      )
    },
  ];

  return (
    <div className="w-72 min-h-screen bg-white border-r border-gray-100 fixed left-0 top-0 flex flex-col z-40 transition-all duration-300">
      {/* Sidebar Header: Brand Logo with Educator Badge */}
      <div className="p-8">
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img src={assets.logo} className="w-32 group-hover:scale-105 transition-transform" alt="Edemy" />
          <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">Educator</span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-4 mt-4 space-y-2">
        {menuItems.map((item) => {
          // Determine if the current menu item is active
          const isActive = location.pathname === item.path || (item.path === '/educator' && location.pathname === '/educator/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 group ${isActive
                ? 'bg-purple-50/80 text-purple-700 shadow-sm shadow-purple-100/20'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {/* Render item icon with active state styling */}
              <div className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {item.icon(isActive)}
              </div>
              <span className={`text-sm font-bold tracking-tight ${isActive ? 'text-gray-900' : ''}`}>
                {item.name}
              </span>
              {/* Pulse indicator for the active route */}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-purple-600 rounded-full shadow-sm animate-pulse"></div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Bottom Action: Switching back to student view */}
      <div className="p-6 mt-auto">
        <div className="bg-gray-50/80 rounded-[30px] p-2">
          <button
            onClick={() => navigate('/')}
            className="w-full h-14 flex items-center justify-center gap-3 bg-white text-gray-900 rounded-[24px] font-bold text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
            </div>
            Switch to Student
          </button>
        </div>
        {/* Version Info Placeholder */}
        <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6 opacity-50">Skill Hub v1.0</p>
      </div>
    </div>
  );
};

export default Sidebar;
