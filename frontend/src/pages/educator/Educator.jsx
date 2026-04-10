import React, { useContext, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/educator/Sidebar';
import Navbar from '../../components/educator/Navbar';
import { useUser, useClerk, UserButton } from '@clerk/clerk-react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';

const Educator = () => {
  const { user } = useUser();
  const { userData, isEducator, becomeEducator } = useContext(AppContext);
  const { openSignIn } = useClerk();
  const navigate = useNavigate();

  // Check if user is educator
  if (!user || userData?.role !== 'educator') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <div className="max-w-4xl w-full">
          {/* Header with Navigation Link Back */}
          <div className="absolute top-8 left-8">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold text-sm transition transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
              Back to Edemy
            </button>
          </div>

          {/* Logo */}
          <img src={assets.logo} alt="Edemy" className="w-48 mx-auto mb-12 opacity-80" />

          {/* Hero Text */}
          <div className="space-y-6 mb-16">
            <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
              Become an Instructor
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight leading-[1.1]">
              Share your knowledge <br />
              <span className="text-purple-600">Empower a generation.</span>
            </h1>
            <p className="text-gray-500 text-xl max-w-2xl mx-auto font-medium">
              Join thousands of educators worldwide and start your teaching career today.
              Build your brand, reach millions, and earn from your expertise.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            {user ? (
               // If user is a student and already has some progress/enrollments, we might want to block them
               // But for now, let's just respect the role they have.
               userData?.role === 'student' && userData?.enrolledCourses?.length > 0 ? (
                 <div className="px-12 py-5 bg-red-50 text-red-600 text-lg font-bold rounded-[20px] border border-red-100 italic">
                   Student Profile Active - Educator Access Restricted
                 </div>
               ) : (
                <button
                  onClick={becomeEducator}
                  className="px-12 py-5 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-[20px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-200"
                >
                  Apply to Teach Now
                </button>
               )
            ) : (
              <button
                onClick={() => openSignIn()}
                className="px-12 py-5 bg-gray-900 hover:bg-black text-white text-lg font-bold rounded-[20px] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-gray-200"
              >
                Sign In to Begin
              </button>
            )}
            <button className="px-10 py-5 bg-white border-2 border-gray-100 hover:border-gray-200 text-gray-900 text-lg font-bold rounded-[20px] transition-all">
              Learn How it Works
            </button>
          </div>

          {/* Features Grid */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            <div className="bg-gray-50/50 p-8 rounded-[30px] border border-gray-50 shadow-sm">
              <div className="w-12 h-12 bg-blue-100/50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              </div>
              <h3 className="font-black text-xl text-gray-900 mb-2 tracking-tight">Powerful Tools</h3>
              <p className="text-gray-500 font-medium">Advanced course builder and high-quality video playback.</p>
            </div>
            <div className="bg-gray-50/50 p-8 rounded-[30px] border border-gray-50 shadow-sm">
              <div className="w-12 h-12 bg-emerald-100/50 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h3 className="font-black text-xl text-gray-900 mb-2 tracking-tight">Monetize Skills</h3>
              <p className="text-gray-500 font-medium">Earn money every time a student purchases your course.</p>
            </div>
            <div className="bg-gray-50/50 p-8 rounded-[30px] border border-gray-50 shadow-sm">
              <div className="w-12 h-12 bg-purple-100/50 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              </div>
              <h3 className="font-black text-xl text-gray-900 mb-2 tracking-tight">Global Reach</h3>
              <p className="text-gray-500 font-medium">Teach students from all over the world in their native language.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-72">
        {/* Custom Educator Topbar */}
        <div className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-50 sticky top-0 z-30 px-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-1.5 h-6 bg-purple-600 rounded-full shadow-[0_0_10px_purple]"></div>
            <h2 className="text-lg font-black text-gray-800 tracking-tight">Instructor Workshop</h2>
          </div>

          <div className="flex items-center gap-6">

            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-gray-800">Hello, {user?.firstName || 'Educator'}</span>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 border-2 border-purple-100 hover:border-purple-600 transition-all"
                  }
                }}
              />
            </div>
          </div>
        </div>

        <main className="p-10 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Educator;
