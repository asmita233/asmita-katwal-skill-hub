import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Footer from '../../components/students/Footer';
import ReactPlayer from 'react-player';
import axios from 'axios';
import { toast } from 'react-toastify';

const CourseDetails = () => {
  // Extract unique course ID from URL
  const { id } = useParams();

  // Access global state and helper methods from AppContext
  const {
    currency,
    calculateRating,
    calculateChapterTime,
    calculateCourseDuration,
    calculateNoOfLectures,
    navigate,
    user,
    backendUrl,
    getToken,
    enrolledCourses,
    fetchEnrolledCourses
  } = useContext(AppContext);

  // Component state management
  const [courseData, setCourseData] = useState(null); // Stores full course object from API
  const [openSections, setOpenSections] = useState({}); // Tracks which accordion chapters are expanded
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false); // Flag if user already owns course
  const [playerData, setPlayerData] = useState(null); // Holds lecture data for the preview player
  const [inWishlist, setInWishlist] = useState(false); // Flag for current wishlist status
  const [wishlistLoading, setWishlistLoading] = useState(false); // Loading state for wishlist toggle

  // Fetch individual course details from the backend
  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/courses/' + id);
      if (data.success) {
        setCourseData(data.course);
        // Automatically open the first chapter accordion on load
        if (data.course.courseContent && data.course.courseContent.length > 0) {
          setOpenSections({ [data.course.courseContent[0].chapterId]: true });
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error fetching course details');
    }
  };

  // Check if the current course exists in the logged-in user's wishlist
  const fetchWishlistStatus = async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + '/api/user/wishlist', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        const isInWishlist = data.wishlist.some(course => course._id === id);
        setInWishlist(isInWishlist);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  // Add or remove course from wishlist
  const toggleWishlist = async () => {
    if (!user) {
      toast.info('Please login to add to wishlist');
      return;
    }

    setWishlistLoading(true);
    try {
      const token = await getToken();
      if (inWishlist) {
        // Remove if already in wishlist
        const { data } = await axios.delete(`${backendUrl}/api/user/wishlist/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data.success) {
          setInWishlist(false);
          toast.success('Removed from wishlist');
        }
      } else {
        // Add if not in wishlist
        const { data } = await axios.post(`${backendUrl}/api/user/wishlist`,
          { courseId: id },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.success) {
          setInWishlist(true);
          toast.success('Added to wishlist');
        }
      }
    } catch (error) {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Data synchronization hooks
  useEffect(() => {
    fetchCourseData();
    // Also fetch enrolled courses to ensure we have the latest status
    if (user) {
      fetchEnrolledCourses();
      fetchWishlistStatus();
    }
  }, [id, user]);

  useEffect(() => {
    // Determine enrollment status by checking the user's enrolled courses list
    if (id && enrolledCourses && enrolledCourses.length >= 0) {
      const isEnrolled = enrolledCourses.some((course) => {
        if (!course || !course.courseId) return false;
        const enrolledCourseId = course.courseId._id || course.courseId;
        return enrolledCourseId && enrolledCourseId.toString() === id.toString();
      });
      setIsAlreadyEnrolled(isEnrolled);
    }
  }, [enrolledCourses, id]);

  // Handle accordion toggle for sections (chapters)
  const toggleSection = (chapterId) => {
    setOpenSections((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // Initiates checkout via Stripe or moves user directly if already enrolled
  const handleEnrollNow = async () => {
    if (!user) {
      toast.info('Please login to enroll in this course');
      return;
    }

    if (isAlreadyEnrolled) {
      navigate(`/player/${id}`); // Direct link to player if owned
      return;
    }

    try {
      const token = await getToken();
      // Call backend to create a Stripe checkout session
      const { data } = await axios.post(backendUrl + '/api/payment/create-checkout-session', {
        courseId: id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        if (data.isFree) {
          toast.success('Successfully enrolled in free course!');
          navigate(`/player/${id}`);
        } else {
          // Redirect browser to the unique Stripe Checkout URL
          window.location.href = data.url;
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error initiating enrollment');
    }
  };

  // Helper to turn various YouTube URL formats into a standardized video ID
  const extractVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  // Show loading spinner while course data is being fetched
  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Prepare UI presentational data
  const discountedPrice = (
    courseData.coursePrice -
    (courseData.discount * courseData.coursePrice) / 100
  ).toFixed(2);

  const rating = calculateRating(courseData);
  const totalLectures = calculateNoOfLectures(courseData);
  const totalDuration = calculateCourseDuration(courseData);

  return (
    <>
      <div className="flex flex-col-reverse md:flex-row gap-10 relative items-start justify-between md:px-36 px-8 md:pt-30 pt-20 text-left">

        {/* Left Column: Course Metadata and Curriculum */}
        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-details-heading-large text-course-details-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>

          {/* Short Intro rendered as HTML (from rich text editor) */}
          <div
            className="pt-4 pb-1 text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription?.substring(0, 200) + '...'
            }}
          />

          {/* Overall Rating and Statistics bar */}
          <div className="flex items-center space-x-2 pt-3 pb-1 text-sm">
            <p className="text-yellow-500">{rating}</p>
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
            <p className="text-blue-600">
              ({courseData.courseRatings?.length || 0} ratings)
            </p>
            <p>{courseData.enrolledStudents?.length || 0} students</p>
          </div>

          <p className="text-sm">
            Created by{' '}
            <span className="text-blue-600 underline">
              {courseData.educator?.name || 'GreatStack'}
            </span>
          </p>

          {/* Collapsible Content / Course Syllabus */}
          <div className="pt-8">
            <h2 className="text-xl font-semibold text-gray-800">
              Course Structure
            </h2>
            <p className="text-sm pt-1">
              {courseData.courseContent?.length || 0} Sections • {totalLectures} Lectures • {totalDuration} total length
            </p>
          </div>

          {/* Render Chapters (Accordion UI) */}
          <div className="pt-5">
            {courseData.courseContent?.map((chapter, index) => (
              <div
                key={chapter.chapterId}
                className="border border-gray-300 bg-white mb-2 rounded"
              >
                {/* Chapter Head */}
                <div
                  className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleSection(chapter.chapterId)}
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={assets.down_arrow_icon}
                      alt="arrow"
                      className={`w-3 h-3 transition-transform ${openSections[chapter.chapterId] ? 'rotate-180' : ''
                        }`}
                    />
                    <p className="font-medium text-gray-800">
                      {chapter.chapterTitle}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    {chapter.chapterContent?.length || 0} lectures •{' '}
                    {calculateChapterTime(chapter)}
                  </p>
                </div>

                {/* List of Lectures inside Chapter */}
                {openSections[chapter.chapterId] && (
                  <div className="px-4 pb-4">
                    {chapter.chapterContent?.map((lecture, lectureIndex) => (
                      <div
                        key={lecture.lectureId}
                        className="flex items-center justify-between py-2 border-t border-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              isAlreadyEnrolled || lecture.isPreviewFree
                                ? assets.play_icon
                                : assets.lesson_icon
                            }
                            alt="play"
                            className="w-4 h-4 opacity-60"
                          />
                          <p className="text-sm text-gray-700">
                            {lecture.lectureTitle}
                          </p>
                          {/* Allow viewing free preview lectures or ALL lectures if enrolled */}
                          {(isAlreadyEnrolled || lecture.isPreviewFree) && (
                            <button
                              className="text-blue-600 text-xs ml-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isAlreadyEnrolled) {
                                  navigate(`/player/${id}`);
                                } else {
                                  setPlayerData(lecture);
                                }
                              }}
                            >
                              {isAlreadyEnrolled ? 'Play' : 'Preview'}
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {lecture.lectureDuration} min
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Integrated Rich Text Description */}
          <div className="py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Course Description
            </h2>
            <div
              className="text-gray-600 rich-text"
              dangerouslySetInnerHTML={{ __html: courseData.courseDescription }}
            />
          </div>
        </div>

        {/* Right Column: Floating Pricing and Enrollment Card */}
        <div className="max-w-md z-10 shadow-lg rounded-lg overflow-hidden bg-white border border-gray-100 sticky top-24">
          {/* Media Preview: Video if preview chosen, else static thumbnail */}
          {playerData ? (
            <ReactPlayer
              url={playerData.lectureUrl}
              playing={true}
              controls={true}
              width="100%"
              height="200px"
            />
          ) : (
            <img
              src={courseData.courseThumbnail}
              alt={courseData.courseTitle}
              className="w-full h-48 object-cover"
            />
          )}

          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                {courseData.discount}% off
              </span>
              <span className="text-gray-400 text-xs">Limited time offer!</span>
            </div>

            {/* Price breakdown and discount visibility */}
            <div className="flex items-center gap-3 pt-2">
              <p className="text-2xl font-bold text-gray-800">
                {currency}{discountedPrice}
              </p>
              <p className="text-gray-400 line-through text-lg">
                {currency}{courseData.coursePrice}
              </p>
            </div>

            {/* Quick highlights bar */}
            <div className="flex items-center gap-4 pt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <img src={assets.star} alt="rating" className="w-4 h-4" />
                <span>{rating}</span>
              </div>
              <span>|</span>
              <span>{totalLectures} Lessons</span>
              <span>|</span>
              <span>{courseData.enrolledStudents?.length || 0} Students</span>
            </div>

            {/* Enrollment/Purchase Button */}
            <button
              onClick={handleEnrollNow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-6 font-medium transition-colors"
            >
              {isAlreadyEnrolled ? 'Continue Learning' : 'Enroll Now'}
            </button>

            {/* Add to Wishlist Toggle Button (hidden if already enrolled) */}
            {!isAlreadyEnrolled && (
              <button
                onClick={toggleWishlist}
                disabled={wishlistLoading}
                className={`w-full py-3 rounded-lg mt-3 font-medium transition-colors flex items-center justify-center gap-2 ${inWishlist
                  ? 'bg-pink-100 text-pink-600 border border-pink-200 hover:bg-pink-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
              >
                {wishlistLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-400 border-t-transparent"></div>
                ) : (
                  <>
                    <svg
                      className={`w-5 h-5 ${inWishlist ? 'fill-pink-500' : 'fill-none stroke-current'}`}
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {inWishlist ? 'Saved to Wishlist' : 'Add to Wishlist'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Individual User Reviews */}
      <div className="md:px-36 px-8 py-12">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Student Reviews</h2>
        {courseData.courseRatings?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {courseData.courseRatings.map((review, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <img
                        key={i}
                        src={i < review.rating ? assets.star : assets.star_blank}
                        alt="star"
                        className="w-4 h-4"
                      />
                    ))}
                  </div>
                  <span className="text-gray-400 text-sm">•</span>
                  <span className="text-gray-500 text-sm">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 italic border-l-4 border-blue-100 pl-4 py-1">
                  "{review.review || 'No written review'}"
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500">No reviews yet for this course.</p>
          </div>
        )}
      </div>

      {/* Design element: Decorative background gradient */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-100/70 to-white -z-1"></div>

      <Footer />
    </>
  );
};

export default CourseDetails;
