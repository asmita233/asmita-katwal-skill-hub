import React, { useContext } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const Sidebar = () => {
  const location = useLocation();
  const { navigate } = useContext(AppContext);

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/educator',
      icon: assets.home_icon,
    },
    {
      name: 'Add Course',
      path: '/educator/add-course',
      icon: assets.add_icon,
    },
    {
      name: 'My Courses',
      path: '/educator/my-courses',
      icon: assets.my_course_icon,
    },
    {
      name: 'Student Enrolled',
      path: '/educator/student-enrolled',
      icon: assets.person_tick_icon,
    },
  ];

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 fixed left-0 top-0 pt-4 z-40">
      {/* Logo */}
      <div className="px-6 pb-6 border-b border-gray-100">
        <img
          src={assets.logo}
          alt="Edemy"
          className="w-28 cursor-pointer"
          onClick={() => navigate('/')}
        />
      </div>

      {/* Menu Items */}
      <nav className="mt-6">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path === '/educator' && location.pathname === '/educator/');

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive
                  ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`}
            >
              <img
                src={item.icon}
                alt={item.name}
                className={`w-5 h-5 ${isActive ? 'opacity-100' : 'opacity-60'}`}
              />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
