import React from 'react'
import { assets } from '../../assets/assets'
import SearchBar from './SearchBar'

/**
 * Hero Component: The primary "Above the Fold" section of the landing page.
 * Responsibilities:
 * - Directs user attention with a strong value proposition (Heading).
 * - Provides a brief high-level overview of the platform (Description).
 * - Houses the primary search interaction (SearchBar).
 */
const Hero = () => {
  return (
    <div className="
      w-full flex flex-col items-center justify-center
      pt-20 md:pt-36 px-6 pb-16
      text-center space-y-6
      bg-gradient-to-b from-cyan-100/70 to-white
    ">
      {/* --- Main Catchy Heading --- */}
      <h1 className="
        relative font-bold text-gray-800
        md:text-5xl text-3xl
        max-w-3xl
      ">
        Empower your future with the courses designed
        <span className="text-blue-600"> fit your choice.</span>

        {/* Decorative sketch asset (visible on desktop) */}
        <img
          src={assets.sketch}
          alt="sketch"
          className="hidden md:block absolute -bottom-6 right-0"
        />
      </h1>

      {/* --- Sub-description (Desktop Version) --- */}
      <p className="hidden md:block text-gray-500 max-w-2xl">
        We bring together world-class instructors, interactive content,
        and a supportive community to help you achieve your personal
        and professional goals.
      </p>

      {/* --- Sub-description (Mobile Version - Condensed) --- */}
      <p className="md:hidden text-gray-500 max-w-sm">
        We bring together world-class instructors to help you achieve
        your professional goals.
      </p>

      {/* --- Global Search Feature --- */}
      <SearchBar />
    </div>
  )
}

export default Hero

