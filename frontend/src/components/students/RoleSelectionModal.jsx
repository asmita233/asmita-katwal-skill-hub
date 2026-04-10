import React from 'react';
import { useClerk } from '@clerk/clerk-react';

const RoleSelectionModal = ({ isOpen, onClose, onSelect }) => {
    const { openSignIn } = useClerk();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <button 
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 transition-colors"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>

                <div className="p-10 md:p-16">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Join Edemy</h2>
                        <p className="text-gray-500 font-medium text-lg">Choose how you want to use the platform.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Student Option */}
                        <div 
                            onClick={() => onSelect('student')}
                            className="group cursor-pointer bg-blue-50/50 border-2 border-blue-100 hover:border-blue-500 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/50"
                        >
                            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-blue-200">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">I'm a Student</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                I want to learn new skills and advance my career through courses.
                            </p>
                        </div>

                        {/* Teacher Option */}
                        <div 
                            onClick={() => onSelect('educator')}
                            className="group cursor-pointer bg-purple-50/50 border-2 border-purple-100 hover:border-purple-500 rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100/50"
                        >
                            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-purple-200">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">I'm a Teacher</h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                I want to share my knowledge and create professional courses.
                            </p>
                        </div>
                    </div>

                    <p className="mt-12 text-center text-gray-400 text-sm font-medium">
                        Already have an account? <span 
                            onClick={() => { onClose(); openSignIn(); }}
                            className="text-gray-900 font-bold cursor-pointer hover:underline"
                        >Log in</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RoleSelectionModal;
