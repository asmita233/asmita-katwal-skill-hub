import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { AppContext } from '../../context/AppContext';

const Navbar = () => {
  const { navigate, isEducator } = useContext(AppContext);
  const location = useLocation();
  const isCourseListPage = location.pathname.includes('/course-list');
  const { openSignIn } = useClerk();
  const { user } = useUser();

  return (
    <nav className="w-full border-b border-gray-200 bg-white fixed top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-8 lg:px-12 py-3">

        {/* Logo */}
        <img
          onClick={() => navigate('/')}
          src={assets.logo}
          alt="Logo"
          className="w-28 cursor-pointer"
        />

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          {/* Add Courses link - visible for educators or when user clicks to see options */}
          <Link
            to="/course-list"
            className="hover:text-blue-600 transition"
          >
            Add Courses
          </Link>

          {user && (
            <>
              <button
                onClick={() => navigate('/educator')}
                className="hover:text-blue-600 transition"
              >
                {isEducator ? 'Educator Dashboard' : 'Become Educator'}
              </button>

              <Link
                to="/my-enrollments"
                className="hover:text-blue-600 transition"
              >
                My Enrollments
              </Link>
            </>
          )}

          {user ? (
            <UserButton />
          ) : (
            <button
              onClick={() => openSignIn()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm transition"
            >
              Create Account
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-4">
          {user ? (
            <UserButton />
          ) : (
            <button
              onClick={() => openSignIn()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm transition"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
