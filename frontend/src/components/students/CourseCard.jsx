import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  // Extracting global context values for currency and rating calculations
  const { currency, calculateRating } = useContext(AppContext);

  // Calculate average rating for this specific course
  const rating = calculateRating(course);

  // Calculate final price after applying the discount percentage
  const discountedPrice = (
    course.coursePrice -
    (course.discount * course.coursePrice) / 100
  ).toFixed(2);

  return (
    <Link
      to={'/course/' + course._id}
      onClick={() => scrollTo(0, 0)} // Reset scroll position to top when navigating to course details
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white group"
    >
      {/* Course Thumbnail Image */}
      <div className="relative overflow-hidden">
        <img
          src={course.courseThumbnail}
          alt={course.courseTitle}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Discount Badge (conditional) */}
        {course.discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {course.discount}% OFF
          </span>
        )}
      </div>

      {/* Course Details Section */}
      <div className="p-4">
        {/* Course Title - limited to 2 lines for UI consistency */}
        <h3 className="text-base font-semibold text-gray-800 line-clamp-2 min-h-[48px]">
          {course.courseTitle}
        </h3>

        {/* Brand name (Hardcoded for now) */}
        <p className="text-gray-500 text-sm mt-1">Skill Hub</p>

        {/* Star Rating Section */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium text-yellow-600">{rating || '0.0'}</span>
          <div className="flex">
            {/* Generate 5 stars, filling them based on the calculated rating */}
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < Math.floor(rating) ? assets.star : assets.star_blank}
                alt="star"
                className="w-3.5 h-3.5"
              />
            ))}
          </div>
          {/* Total count of ratings */}
          <span className="text-gray-400 text-sm">
            ({course.courseRatings?.length || 0})
          </span>
        </div>

        {/* Pricing Display */}
        <div className="flex items-center gap-2 mt-3">
          <p className="text-lg font-bold text-gray-800">
            {currency}{discountedPrice}
          </p>
          {/* Show original price with strikethrough if there's a discount */}
          {course.discount > 0 && (
            <p className="text-sm text-gray-400 line-through">
              {currency}{course.coursePrice}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
};

export default CourseCard;
