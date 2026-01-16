import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';

const CourseCard = ({ course }) => {
  const { currency, calculateRating } = useContext(AppContext);
  const rating = calculateRating(course);
  const discountedPrice = (
    course.coursePrice -
    (course.discount * course.coursePrice) / 100
  ).toFixed(2);

  return (
    <Link
      to={'/course/' + course._id}
      onClick={() => scrollTo(0, 0)}
      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white group"
    >
      {/* Thumbnail */}
      <div className="relative overflow-hidden">
        <img
          src={course.courseThumbnail}
          alt={course.courseTitle}
          className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {course.discount > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
            {course.discount}% OFF
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 line-clamp-2 min-h-[48px]">
          {course.courseTitle}
        </h3>

        <p className="text-gray-500 text-sm mt-1">GreatStack</p>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm font-medium text-yellow-600">{rating || '0.0'}</span>
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <img
                key={i}
                src={i < Math.floor(rating) ? assets.star : assets.star_blank}
                alt="star"
                className="w-3.5 h-3.5"
              />
            ))}
          </div>
          <span className="text-gray-400 text-sm">
            ({course.courseRatings?.length || 0})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <p className="text-lg font-bold text-gray-800">
            {currency}{discountedPrice}
          </p>
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
