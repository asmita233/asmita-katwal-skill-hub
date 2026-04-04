import React, { useContext, useState } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation } from 'react-router-dom';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { AppContext } from '../../context/AppContext';

const Navbar = () => {
  // Extracting navigation and educator status from global context
  const { navigate, isEducator, theme, toggleTheme } = useContext(AppContext);
  // Get current path for potential active state styling
  const location = useLocation();
  // Clerk hooks for controlling authentication modals
  const { openSignIn, openSignUp } = useClerk();
  // Clerk hook to get current user information
  const { user } = useUser();
  // State for toggling the 'My Learning' dropdown on desktop
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className={`w-full border-b fixed top-0 z-50 transition-all duration-300 ${theme === 'dark' ? 'bg-gray-900/95 border-gray-700 backdrop-blur-md' : 'bg-white/80 border-gray-100 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 sm:px-10 lg:px-12 py-4">

        {/* Logo and Primary Left-side Navigation */}
        <div className="flex items-center gap-8">
          <img
            onClick={() => navigate('/')}
            src={assets.logo}
            alt="Logo"
            className="w-32 cursor-pointer transform hover:scale-105 transition-transform"
          />

          {/* Categories dropdown (Placeholder for now) */}
          <div className="hidden lg:flex items-center text-sm font-medium text-gray-600 hover:text-blue-600 cursor-pointer transition">
            Categories
          </div>
        </div>

        {/* Desktop Menu - Visible on Medium screens and above */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
          {user ? (
            <Link
              to="/course-list"
              className="hover:text-blue-600 transition"
            >
              All Courses
            </Link>
          ) : (
            <button
              onClick={() => openSignIn()}
              className="hover:text-blue-600 transition"
            >
              All Courses
            </button>
          )}

          {/* Authenticated user links */}
          {user && (
            <>
              {/* My Learning Dropdown Section */}
              <div className="relative group">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-1 hover:text-blue-600 transition py-2"
                >
                  My Learning
                  <svg className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {/* Dropdown Menu contents */}
                <div className={`absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 z-50 transition-all duration-200 ${showDropdown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}`}>
                  {/* Link to Student Dashboard */}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                      </svg>
                    </div>
                    Dashboard
                  </Link>
                  {/* Link to Enrolled Courses */}
                  <Link
                    to="/my-enrollments"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    My Enrollments
                  </Link>
                  {/* Link to Wishlist */}
                  <Link
                    to="/wishlist"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-600">
                      <svg className="w-4 h-4" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </div>
                    Wishlist
                  </Link>
                  {/* Link to Certificates */}
                  <Link
                    to="/certificates"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                      </svg>
                    </div>
                    Certificates
                  </Link>
                  {/* Divider */}
                  <div className="border-t border-gray-100 my-1"></div>
                  {/* Link to Profile */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </div>
                    My Profile
                  </Link>

                  {/* Link to Educator Dashboard (If applicable) */}
                  {isEducator && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <Link
                        to="/educator"
                        className="flex items-center gap-3 px-5 py-3 hover:bg-purple-50 group/educator transition"
                      >
                        <div className="w-8 h-8 rounded-lg bg-purple-50 group-hover/educator:bg-purple-100 flex items-center justify-center text-purple-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                          </svg>
                        </div>
                        <span className="font-bold text-purple-700">Educator View</span>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-all duration-200 ${theme === 'dark' ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Conditional Auth Buttons: Avatar if logged in, Sign In/Up if not */}
          {user ? (
            <div className="flex items-center gap-4 ml-4">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 border-2 border-blue-100 hover:border-blue-500 transition-all"
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-4 ml-4">
              <button
                onClick={() => openSignIn()}
                className="text-gray-700 hover:text-blue-600 transition"
              >
                Log in
              </button>
              <button
                onClick={() => openSignUp()}
                className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-lg shadow-gray-200 transition-all active:scale-95"
              >
                Create Account
              </button>
            </div>
          )}
        </div>

        {/* Mobile Menu - Only visible on small screens */}
        <div className="md:hidden flex items-center gap-4">
          {user ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <button
              onClick={() => openSignUp()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition"
            >
              Sign Up
            </button>
          )}
        </div>
      </div>
    </nav >
  );
};

export default Navbar;

