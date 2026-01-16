import React, { useContext, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Footer from '../../components/students/Footer';
import YouTube from 'react-youtube';
import axios from 'axios';
import { toast } from 'react-toastify';

const CourseDetails = () => {
  const { id } = useParams();
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
    enrolledCourses
  } = useContext(AppContext);

  const [courseData, setCourseData] = useState(null);
  const [openSections, setOpenSections] = useState({});
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [playerData, setPlayerData] = useState(null);

  const fetchCourseData = async () => {
    try {
      const { data } = await axios.get(backendUrl + '/api/courses/' + id);
      if (data.success) {
        setCourseData(data.course);
        // Open first section by default
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

  useEffect(() => {
    fetchCourseData();
  }, [id]);

  useEffect(() => {
    if (enrolledCourses.length > 0 && id) {
      const isEnrolled = enrolledCourses.some((course) =>
        (course.courseId._id || course.courseId) === id
      );
      setIsAlreadyEnrolled(isEnrolled);
    }
  }, [enrolledCourses, id]);

  const toggleSection = (chapterId) => {
    setOpenSections((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleEnrollNow = async () => {
    if (!user) {
      toast.info('Please login to enroll in this course');
      return;
    }

    if (isAlreadyEnrolled) {
      navigate(`/player/${id}`);
      return;
    }

    try {
      const token = await getToken();
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
          // Redirect to Stripe checkout
          window.location.href = data.url;
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error initiating enrollment');
    }
  };

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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

        {/* Left Side - Course Info */}
        <div className="max-w-xl z-10 text-gray-500">
          <h1 className="md:text-course-details-heading-large text-course-details-heading-small font-semibold text-gray-800">
            {courseData.courseTitle}
          </h1>

          {/* Course Meta */}
          <div
            className="pt-4 pb-1 text-sm"
            dangerouslySetInnerHTML={{
              __html: courseData.courseDescription?.substring(0, 200) + '...'
            }}
          />

          {/* Rating */}
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

          {/* Course Structure */}
          <div className="pt-8">
            <h2 className="text-xl font-semibold text-gray-800">
              Course Structure
            </h2>
            <p className="text-sm pt-1">
              {courseData.courseContent?.length || 0} Sections • {totalLectures} Lectures • {totalDuration} total length
            </p>
          </div>

          {/* Accordion Sections */}
          <div className="pt-5">
            {courseData.courseContent?.map((chapter, index) => (
              <div
                key={chapter.chapterId}
                className="border border-gray-300 bg-white mb-2 rounded"
              >
                {/* Section Header */}
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

                {/* Section Content */}
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
                              lecture.isPreviewFree
                                ? assets.play_icon
                                : assets.lesson_icon
                            }
                            alt="play"
                            className="w-4 h-4 opacity-60"
                          />
                          <p className="text-sm text-gray-700">
                            {lecture.lectureTitle}
                          </p>
                          {lecture.isPreviewFree && (
                            <button
                              className="text-blue-600 text-xs ml-2 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlayerData(lecture);
                              }}
                            >
                              Preview
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

          {/* Course Description */}
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

        {/* Right Side - Enrollment Card */}
        <div className="max-w-md z-10 shadow-lg rounded-lg overflow-hidden bg-white border border-gray-100 sticky top-24">
          {/* Course Thumbnail or Video Preview */}
          {playerData ? (
            <YouTube
              videoId={extractVideoId(playerData.lectureUrl)}
              opts={{
                width: '100%',
                height: '200',
                playerVars: { autoplay: 1 },
              }}
              className="w-full"
            />
          ) : (
            <img
              src={courseData.courseThumbnail}
              alt={courseData.courseTitle}
              className="w-full h-48 object-cover"
            />
          )}

          <div className="p-5">
            {/* Discount Badge */}
            <div className="flex items-center gap-2 mb-3">
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                {courseData.discount}% off
              </span>
              <span className="text-gray-400 text-xs">Limited time offer!</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 pt-2">
              <p className="text-2xl font-bold text-gray-800">
                {currency}{discountedPrice}
              </p>
              <p className="text-gray-400 line-through text-lg">
                {currency}{courseData.coursePrice}
              </p>
              <span className="text-green-600 text-sm font-medium">
                {courseData.discount}% off
              </span>
            </div>

            {/* Stats */}
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

            {/* What's in the course */}
            <div className="pt-6">
              <h3 className="font-semibold text-gray-800 mb-3">
                What's in the course?
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <img src={assets.blue_tick_icon} alt="tick" className="w-4 h-4" />
                  Lifetime access with free updates
                </li>
                <li className="flex items-center gap-2">
                  <img src={assets.blue_tick_icon} alt="tick" className="w-4 h-4" />
                  Step-by-step, hands-on project guidance
                </li>
                <li className="flex items-center gap-2">
                  <img src={assets.blue_tick_icon} alt="tick" className="w-4 h-4" />
                  Downloadable resources and source code
                </li>
                <li className="flex items-center gap-2">
                  <img src={assets.blue_tick_icon} alt="tick" className="w-4 h-4" />
                  Quizzes to test your knowledge
                </li>
                <li className="flex items-center gap-2">
                  <img src={assets.blue_tick_icon} alt="tick" className="w-4 h-4" />
                  Certificate on completion
                </li>
              </ul>
            </div>

            {/* Enroll Button */}
            <button
              onClick={handleEnrollNow}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-6 font-medium transition-colors"
            >
              {isAlreadyEnrolled ? 'Continue Learning' : 'Enroll Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Background gradient */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-cyan-100/70 to-white -z-1"></div>

      <Footer />
    </>
  );
};

export default CourseDetails;
