import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { useClerk, useUser } from '@clerk/clerk-react';

const PathSection = () => {
    const { navigate, isEducator, userData } = useContext(AppContext);
    const { openSignUp } = useClerk();
    const { user } = useUser();

    return (
        <div className="py-20 bg-white">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Choose Your Path</p>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-12">Master the <span className="text-blue-600">Skills</span> That Matter.</h2>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Student Path - Hidden if already an educator */}
                    {!isEducator && (
                        <div
                            onClick={() => {
                                if (user) {
                                    navigate('/dashboard');
                                } else {
                                    sessionStorage.setItem('preferredRole', 'student');
                                    openSignUp();
                                }
                            }}
                            className="group cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 hover:border-blue-300 rounded-2xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100"
                        >
                            <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Learning</h3>
                            <p className="text-gray-600 mb-4">
                                Access thousands of courses and learn at your own pace.
                            </p>
                            <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                <span>{user ? 'Go to Dashboard' : 'Create Student Account'}</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                </svg>
                            </div>
                        </div>
                    )}

                    {/* Educator Path - Hidden if already a student */}
                    {!(user && !isEducator && userData?.enrolledCourses?.length > 0) && (
                        <div
                            onClick={() => {
                                sessionStorage.setItem('preferredRole', 'educator');
                                navigate('/educator');
                            }}
                            className={`group cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 hover:border-purple-300 rounded-2xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100 ${isEducator ? 'md:col-span-2 max-w-lg mx-auto w-full' : ''}`}
                        >
                            <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Teaching</h3>
                            <p className="text-gray-600 mb-4">
                                Share your expertise and earn from your knowledge.
                            </p>
                            <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all">
                                <span>{(user && isEducator) ? 'Go to Educator Panel' : 'Become an Instructor'}</span>
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                </svg>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PathSection;
