import React from 'react';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';

/**
 * CallToAction Component: A high-conversion footer banner used to capture user interest 
 * near the end of the page scrolling experience.
 */
const CallToAction = () => {
  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 py-16 px-8">
      <div className="max-w-4xl mx-auto text-center">
        {/* --- Catchy Slogan --- */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Learn anything, anytime, anywhere
        </h1>

        <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
          Incididunt sint fugiat pariatur cupidatat consectetur sit cillum anim
          id veniam aliqua proident excepteur commodo do ea.
        </p>

        {/* --- Action Buttons --- */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/course-list"
            className="px-8 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-gray-100 transition shadow-lg"
          >
            Get started
          </Link>
          <Link
            to="/course-list"
            className="px-8 py-3 text-white border border-white/30 rounded-lg font-medium hover:bg-white/10 transition flex items-center gap-2"
          >
            Learn more
            <img src={assets.arrow_icon} alt="arrow" className="w-4 h-4 invert" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CallToAction;

