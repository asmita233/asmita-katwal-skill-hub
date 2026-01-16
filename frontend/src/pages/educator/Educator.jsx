import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/educator/Sidebar';
import Navbar from '../../components/educator/Navbar';
import { useUser } from '@clerk/clerk-react';
import { AppContext } from '../../context/AppContext';
import Footer from '../../components/students/Footer';

const Educator = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const { setIsEducator } = useContext(AppContext);

  useEffect(() => {
    if (isLoaded && !user) {
      navigate('/');
    } else if (user) {
      setIsEducator(true);
    }
  }, [user, isLoaded, navigate, setIsEducator]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64">
        <Navbar />
        <main className="p-6">
          <Outlet />
        </main>
        <footer className="border-t border-gray-200 py-4 px-6 mt-auto">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>© {new Date().getFullYear()} Edemy. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-gray-700">
                <img src="" alt="" className="w-4 h-4" />
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Educator;
