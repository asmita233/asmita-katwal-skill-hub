import React, { useContext, useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import ReactPlayer from 'react-player';
import Footer from '../../components/students/Footer';
import QASection from '../../components/students/QASection';
import { Line } from 'rc-progress';
import axios from 'axios';
import { toast } from 'react-toastify';

const Player = () => {
  // Get courseId from the URL to fetch specific course content
  const { courseId } = useParams();

  // Extract shared state and persistence methods from the context
  const { navigate, backendUrl, getToken, enrolledCourses, fetchEnrolledCourses, user, isEducator } = useContext(AppContext);

  // --- Component State Management ---
  const [courseData, setCourseData] = useState(null); // Full course structure and metadata
  const [currentLecture, setCurrentLecture] = useState(null); // The lecture currently being watched
  const [sidebarOpen, setSidebarOpen] = useState(true); // Toggle for course content sidebar
  const [completedLectures, setCompletedLectures] = useState([]); // List of IDs student has finished
  const [openChapters, setOpenChapters] = useState({}); // Tracking expanded/collapsed accordion sections
  const [accessVerified, setAccessVerified] = useState(false); // Whether the user has access to the course
  const [accessLoading, setAccessLoading] = useState(true); // Loading state for access check

  // Track if the video should be playing (auto-play when changing lectures)
  const [isPlaying, setIsPlaying] = useState(false);

  // Ref for the native video element
  const videoRef = useRef(null);

  /**
   * Detect if a URL is a direct video file (Cloudinary, S3, etc.) vs a streaming service (YouTube, Vimeo)
   */
  const isDirectVideoUrl = (url) => {
    if (!url) return false;
    // Cloudinary, S3, or any direct file URL
    const directPatterns = [
      /cloudinary\.com/i,
      /\.mp4(\?|$)/i,
      /\.webm(\?|$)/i,
      /\.ogg(\?|$)/i,
      /\.mov(\?|$)/i,
      /\.avi(\?|$)/i,
      /s3\.amazonaws\.com/i,
      /blob:/i,
    ];
    return directPatterns.some(pattern => pattern.test(url));
  };

  /**
   * Detect if a URL is a YouTube or Vimeo URL that ReactPlayer can handle
   */
  const isStreamingUrl = (url) => {
    if (!url) return false;
    const streamingPatterns = [
      /youtube\.com/i,
      /youtu\.be/i,
      /vimeo\.com/i,
      /dailymotion\.com/i,
      /soundcloud\.com/i,
      /facebook\.com.*video/i,
      /twitch\.tv/i,
    ];
    return streamingPatterns.some(pattern => pattern.test(url));
  };

  /**
   * Fetch course details including curriculum (chapters/lectures)
   */
  const getCourseData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(backendUrl + '/api/courses/' + courseId, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setCourseData(data.course);

        // Also fetch enrolled courses to ensure we have the latest status/progress
        fetchEnrolledCourses();

        // On initial load, default to the very first lecture of the first chapter
        if (!currentLecture && data.course.courseContent?.[0]?.chapterContent?.[0]) {
          setCurrentLecture(data.course.courseContent[0].chapterContent[0]);
        }

        // Initialize sidebar with all chapters expanded
        const allOpen = {};
        data.course.courseContent?.forEach((chapter) => {
          allOpen[chapter.chapterId] = true;
        });
        setOpenChapters(allOpen);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }

  /**
   * Verify that the user has access to this course (enrolled or is the educator)
   */
  const verifyAccess = () => {
    if (!user || !courseData) return;

    // Check if user is the educator
    const isCourseEducator = courseData.educator?._id === user.id || courseData.educator === user.id;

    // Check if user is enrolled
    const isEnrolled = enrolledCourses?.some((course) => {
      if (!course || !course.courseId) return false;
      const enrolledCourseId = course.courseId._id || course.courseId;
      return enrolledCourseId && enrolledCourseId.toString() === courseId.toString();
    });

    if (isCourseEducator || isEnrolled || isEducator) {
      setAccessVerified(true);
    } else {
      // User has no access - redirect to course page
      toast.error('You need to enroll in this course first!');
      navigate(`/course/${courseId}`);
    }
    setAccessLoading(false);
  };

  // Sync student's specific course progress from the context whenever enrolledCourses data refreshes
  useEffect(() => {
    if (enrolledCourses && enrolledCourses.length > 0) {
      const course = enrolledCourses.find((c) => (c.courseId?._id || c.courseId) === courseId);
      if (course) {
        setCompletedLectures(course.progress?.completedLectures || []);
      }
    }
  }, [enrolledCourses, courseId]);

  // Check access once we have both user data, course data, and enrolled courses
  useEffect(() => {
    if (user && courseData && enrolledCourses) {
      verifyAccess();
    }
  }, [user, courseData, enrolledCourses]);

  // Initial data fetch for the course
  useEffect(() => {
    getCourseData();
  }, [courseId]);

  // Sync isPlaying when lecture changes — also handle native video element
  useEffect(() => {
    if (currentLecture) {
      setIsPlaying(true);
      // For native video, we need to reload the source
      if (videoRef.current && isDirectVideoUrl(currentLecture.lectureUrl)) {
        videoRef.current.load();
        videoRef.current.play().catch(() => {
          // Autoplay may be blocked, that's OK
          setIsPlaying(false);
        });
      }
    }
  }, [currentLecture]);

  /**
   * Notify backend that a lecture has been completed by the student
   */
  const handleLectureComplete = async (lectureId) => {
    try {
      const token = await getToken();
      const { data } = await axios.post(backendUrl + '/api/user/update-progress', {
        courseId,
        lectureId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        toast.success('Lecture marked as completed!');
        setCompletedLectures(data.progress.completedLectures);
        fetchEnrolledCourses(); // Refresh global context so progress reflects site-wide
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Toggle logic for opening/closing chapter accordion sections
  const toggleChapter = (chapterId) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  /**
   * Calculate percentage of course completion
   */
  const calculateProgress = () => {
    if (!courseData) return 0;
    let totalLectures = 0;
    courseData.courseContent?.forEach((chapter) => {
      totalLectures += chapter.chapterContent?.length || 0;
    });
    return totalLectures > 0
      ? Math.round((completedLectures.length / totalLectures) * 100)
      : 0;
  };

  /**
   * Render the video player based on the URL type
   */
  const renderVideoPlayer = () => {
    if (!currentLecture?.lectureUrl) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-white text-lg gap-4">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </div>
          <p className="text-gray-400 font-medium">No video URL found for this lecture</p>
          <p className="text-gray-500 text-sm">The educator hasn't uploaded a video yet.</p>
        </div>
      );
    }

    const url = currentLecture.lectureUrl;

    // For direct video files (Cloudinary, S3, etc.) — use native HTML5 video
    if (isDirectVideoUrl(url)) {
      return (
        <video
          ref={videoRef}
          controls
          playsInline
          preload="auto"
          className="w-full h-full object-contain bg-black"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            handleLectureComplete(currentLecture?.lectureId);
          }}
          onError={(e) => {
            console.error('Native video error:', e);
            toast.error('Video failed to load. The file may be unavailable or the format is unsupported.');
          }}
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
          Your browser does not support HTML5 video.
        </video>
      );
    }

    // For YouTube, Vimeo, etc. — use ReactPlayer
    if (isStreamingUrl(url)) {
      return (
        <ReactPlayer
          url={url}
          controls={true}
          playing={isPlaying}
          muted={false}
          width="100%"
          height="100%"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            handleLectureComplete(currentLecture?.lectureId);
          }}
          onError={(e) => {
            console.error('ReactPlayer Error:', e);
            toast.error('Could not load the video. Please check the source URL.');
          }}
          config={{
            youtube: {
              playerVars: { showinfo: 1, rel: 0 }
            },
          }}
        />
      );
    }

    // Fallback: Try native video first, then ReactPlayer
    return (
      <video
        ref={videoRef}
        controls
        playsInline
        preload="auto"
        className="w-full h-full object-contain bg-black"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          handleLectureComplete(currentLecture?.lectureId);
        }}
        onError={(e) => {
          console.error('Fallback video error:', e);
          toast.error('Video could not be loaded.');
        }}
      >
        <source src={url} type="video/mp4" />
        Your browser does not support this video format.
      </video>
    );
  };

  // Standard loading screen while data is arriving from API
  if (!courseData || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          <p className="text-gray-500 text-sm">Loading course content...</p>
        </div>
      </div>
    );
  }

  // If access not verified, don't render the player
  if (!accessVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-500 mb-4">You need to enroll in this course to access the content.</p>
          <button
            onClick={() => navigate(`/course/${courseId}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Go to Course Page
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Player Sticky Header: Contains Title and Overall Progress Meter */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/my-enrollments')}
            className="text-gray-500 hover:text-gray-700"
          >
            <img src={assets.arrow_icon} alt="back" className="w-5 h-5 rotate-180" />
          </button>
          <h1 className="font-semibold text-gray-800 text-lg truncate max-w-md">
            {courseData.courseTitle}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2">
            <span className="text-sm text-gray-500">{progress}% Complete</span>
            <div className="w-32">
              <Line
                percent={progress}
                strokeWidth={4}
                strokeColor="#22c55e"
                trailWidth={4}
                trailColor="#e5e7eb"
              />
            </div>
          </div>
          {/* Mobile menu toggle for content sidebar */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 rounded hover:bg-gray-100"
          >
            <img src={assets.dropdown_icon} alt="menu" className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Main Content Area: Video Player + Lecture Description + Q&A */}
        <div className={`flex-1 p-4 md:p-8 ${sidebarOpen ? 'md:mr-80' : ''}`}>
          <div className="bg-black rounded-lg overflow-hidden aspect-video mb-6 shadow-lg shadow-gray-200">
            {renderVideoPlayer()}
          </div>

          {/* Debug Info - Video Source URL */}
          <div className="mb-4 text-[10px] text-gray-300 truncate">
            Source: {currentLecture?.lectureUrl || 'No URL found'}
            {currentLecture?.lectureUrl && (
              <span className="ml-2 text-gray-400">
                ({isDirectVideoUrl(currentLecture.lectureUrl) ? 'Direct File' : isStreamingUrl(currentLecture.lectureUrl) ? 'Streaming' : 'Unknown'})
              </span>
            )}
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {currentLecture?.lectureTitle}
              </h2>
              {/* Manual "Mark as complete" toggle */}
              <button
                onClick={() => handleLectureComplete(currentLecture?.lectureId)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${completedLectures.includes(currentLecture?.lectureId)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
              >
                {completedLectures.includes(currentLecture?.lectureId)
                  ? '✓ Completed'
                  : 'Mark as Complete'}
              </button>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{currentLecture?.lectureDuration} min</span>
              <span>•</span>
              <span>Lecture {currentLecture?.lectureOrder}</span>
              {/* PDF Download Button */}
              {currentLecture?.lecturePdf && (
                <>
                  <span>•</span>
                  <a
                    href={currentLecture.lecturePdf}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Study Material
                  </a>
                </>
              )}
            </div>

            {/* About Course Section */}
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-medium text-gray-800 mb-3">About this course</h3>
              <div
                className="text-gray-600 text-sm"
                dangerouslySetInnerHTML={{
                  __html: courseData.courseDescription?.substring(0, 500),
                }}
              />
            </div>

            {/* Interactive Discussion Section */}
            <div className="mt-8">
              <QASection
                courseId={courseId}
                lectureId={currentLecture?.lectureId}
              />
            </div>
          </div>
        </div>

        {/* Vertical Sidebar: Full curriculum list for navigation */}
        <div
          className={`fixed right-0 top-[73px] h-[calc(100vh-73px)] w-80 bg-white border-l border-gray-200 overflow-y-auto transition-transform z-30 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
            }`}
        >
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Course Content</h3>
            <p className="text-sm text-gray-500 mt-1">
              {completedLectures.length} of{' '}
              {courseData.courseContent?.reduce(
                (acc, ch) => acc + (ch.chapterContent?.length || 0),
                0
              )}{' '}
              completed
            </p>
          </div>

          {/* Hierarchy of Chapters and Lectures */}
          {courseData.courseContent?.map((chapter, chapterIndex) => (
            <div key={chapter.chapterId} className="border-b border-gray-100">
              <button
                onClick={() => toggleChapter(chapter.chapterId)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={assets.down_arrow_icon}
                    alt="arrow"
                    className={`w-3 h-3 transition-transform ${openChapters[chapter.chapterId] ? 'rotate-180' : ''
                      }`}
                  />
                  <span className="font-medium text-gray-800 text-sm text-left">
                    {chapter.chapterTitle}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {chapter.chapterContent?.length || 0} lectures
                </span>
              </button>

              {/* Render Lectures for the expanded chapter */}
              {openChapters[chapter.chapterId] && (
                <div className="bg-gray-50">
                  {chapter.chapterContent?.map((lecture, lectureIndex) => {
                    const isActive =
                      currentLecture?.lectureId === lecture.lectureId;
                    const isCompleted = completedLectures.includes(
                      lecture.lectureId
                    );

                    return (
                      <button
                        key={lecture.lectureId}
                        onClick={() => setCurrentLecture(lecture)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${isActive
                          ? 'bg-blue-50 border-l-2 border-blue-600'
                          : 'hover:bg-gray-100'
                          }`}
                      >
                        {/* Visual indicator for active and completion states */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${isCompleted
                            ? 'bg-green-500 text-white'
                            : isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 text-gray-500'
                            }`}
                        >
                          {isCompleted ? '✓' : lectureIndex + 1}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${isActive
                              ? 'text-blue-600 font-medium'
                              : 'text-gray-700'
                              }`}
                          >
                            {lecture.lectureTitle}
                          </p>
                          <div className="flex items-center gap-2">
                            <p className="text-xs text-gray-400">
                              {lecture.lectureDuration} min
                            </p>
                            {lecture.lecturePdf && (
                              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                PDF
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Player;
