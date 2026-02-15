import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { useClerk } from '@clerk/clerk-react';

const Landing = () => {
    const { navigate } = useContext(AppContext);
    const { openSignUp, openSignIn } = useClerk();

    return (
        <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
            {/* Background Orbs for Premium Look */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            {/* Top Navigation Bar */}
            <nav className="w-full px-6 md:px-16 py-4 flex items-center justify-between z-20">
                <img src={assets.logo} alt="Edemy" className="w-28 md:w-36" />
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => openSignIn()}
                        className="text-gray-600 hover:text-gray-900 font-medium transition"
                    >
                        Log in
                    </button>
                    <button
                        onClick={() => openSignUp()}
                        className="bg-gray-900 hover:bg-black text-white px-5 py-2.5 rounded-lg font-semibold transition-all hover:-translate-y-0.5"
                    >
                        Sign up
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 text-center z-10 animate-fadeIn">
                <div className="max-w-4xl w-full space-y-10">
                    {/* Hero Text */}
                    <div className="space-y-6">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight">
                            Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Skills</span> That Matter.
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                            The world's most advanced learning platform. Join 10M+ students and start your journey today.
                        </p>
                    </div>

                    {/* Two Path Options */}
                    <div className="pt-8">
                        <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Choose Your Path</p>
                        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                            {/* Student Path */}
                            <div
                                onClick={() => {
                                    sessionStorage.setItem('preferredRole', 'student');
                                    openSignUp();
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
                                    Access 10,000+ courses from world-class instructors. Learn at your own pace.
                                </p>
                                <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 transition-all">
                                    <span>Create Student Account</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </div>
                            </div>

                            {/* Educator Path */}
                            <div
                                onClick={() => {
                                    sessionStorage.setItem('preferredRole', 'educator');
                                    navigate('/educator');
                                }}
                                className="group cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-100 hover:border-purple-300 rounded-2xl p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100"
                            >
                                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Start Teaching</h3>
                                <p className="text-gray-600 mb-4">
                                    Share your expertise with millions of students. Earn money from your knowledge.
                                </p>
                                <div className="flex items-center text-purple-600 font-semibold group-hover:gap-3 transition-all">
                                    <span>Become an Instructor</span>
                                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Browse Courses CTA */}
                    <div className="pt-4">
                        <button
                            onClick={() => navigate('/course-list')}
                            className="text-gray-500 hover:text-blue-600 font-medium transition-colors"
                        >
                            Or browse courses without an account →
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats / Social Proof */}
            <div className="py-12 border-t border-gray-100 z-10">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-8">Trusted by industry leaders</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        <img src={assets.microsoft_logo} alt="Microsoft" className="h-6 md:h-8" />
                        <img src={assets.walmart_logo} alt="Walmart" className="h-6 md:h-8" />
                        <img src={assets.accenture_logo} alt="Accenture" className="h-6 md:h-8" />
                        <img src={assets.adobe_logo} alt="Adobe" className="h-6 md:h-8" />
                        <img src={assets.paypal_logo} alt="PayPal" className="h-6 md:h-8" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="py-4 text-center text-sm text-gray-400 font-medium border-t border-gray-50">
                © {new Date().getFullYear()} Edemy Inc. All rights reserved.
            </div>
        </div>
    );
};

export default Landing;
