import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CourseCard = ({ course }) => {
  // Extracting global context values for currency, rating calculations, and enrollment data
  const { currency, calculateRating, enrolledCourses, navigate, userData, getToken, backendUrl, user } = useContext(AppContext);

  // Calculate average rating for this specific course
  const rating = calculateRating(course);

  // Calculate final price after applying the discount percentage
  const discountedPrice = (
    course.coursePrice -
    (course.discount * course.coursePrice) / 100
  ).toFixed(2);

  // Check if the current student is already enrolled in this course
  const isEnrolled = enrolledCourses?.some((enrolled) => {
    if (!enrolled || !enrolled.courseId) return false;
    const enrolledId = enrolled.courseId._id || enrolled.courseId;
    return enrolledId && enrolledId.toString() === course._id?.toString();
  });

  // Handle direct enrollment/payment
  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/course/' + course._id);
      scrollTo(0, 0);
      return;
    }

    try {
      const token = await getToken();
      const { data } = await axios.post(backendUrl + '/api/payment/create-checkout-session', {
        courseId: course._id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        if (data.isFree) {
          navigate(`/player/${course._id}`);
        } else {
          window.location.href = data.url;
        }
      } else {
        // Fallback to course details if payment session creation fails
        navigate('/course/' + course._id);
        scrollTo(0, 0);
      }
    } catch (error) {
      console.error("Enrollment error:", error);
      navigate('/course/' + course._id);
      scrollTo(0, 0);
    }
  };

  const handleThumbnailError = (event) => {
    event.currentTarget.src = '/course-placeholder.svg';
    event.currentTarget.onerror = null;
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 bg-white group flex flex-col">
      {/* Course Thumbnail Image — clicking it goes to details */}
      <Link
        to={'/course/' + course._id}
        onClick={() => scrollTo(0, 0)}
      >
        <div className="relative overflow-hidden">
          <img
            src={course.courseThumbnail || '/course-placeholder.svg'}
            alt={course.courseTitle}
            className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleThumbnailError}
          />
          {/* Discount Badge (conditional) */}
          {course.discount > 0 && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              {course.discount}% OFF
            </span>
          )}
        </div>
      </Link>

      {/* Course Details Section */}
      <div className="p-4 flex flex-col flex-1">
        {/* Course Title - limited to 2 lines for UI consistency */}
        <Link to={'/course/' + course._id} onClick={() => scrollTo(0, 0)}>
          <h3 className="text-base font-semibold text-gray-800 line-clamp-2 min-h-[48px] hover:text-blue-600 transition-colors">
            {course.courseTitle}
          </h3>
        </Link>

        {/* Brand name */}
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

        {/* Spacer to push button to bottom */}
        <div className="flex-1"></div>

        {/* Enrollment Action Button */}
        {isEnrolled ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate(`/player/${course._id}`);
            }}
            className="w-full mt-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Continue Learning
          </button>
        ) : (userData?._id && userData._id === (course.educator?._id || course.educator)) ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              navigate(`/player/${course._id}`);
            }}
            className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Course
          </button>
        ) : (
          <button
            onClick={handleEnroll}
            className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            Enroll
          </button>
        )}
      </div>
    </div>
  );
};

export default CourseCard;

