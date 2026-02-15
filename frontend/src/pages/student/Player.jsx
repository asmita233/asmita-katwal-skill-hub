import React, { useContext, useEffect, useState } from 'react';
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
  const { navigate, backendUrl, getToken, enrolledCourses, fetchEnrolledCourses } = useContext(AppContext);

  // --- Component State Management ---
  const [courseData, setCourseData] = useState(null); // Full course structure and metadata
  const [currentLecture, setCurrentLecture] = useState(null); // The lecture currently being watched
  const [sidebarOpen, setSidebarOpen] = useState(true); // Toggle for course content sidebar
  const [completedLectures, setCompletedLectures] = useState([]); // List of IDs student has finished
  const [openChapters, setOpenChapters] = useState({}); // Tracking expanded/collapsed accordion sections

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

  // Sync student's specific course progress from the context whenever enrolledCourses data refreshes
  useEffect(() => {
    if (enrolledCourses && enrolledCourses.length > 0) {
      const course = enrolledCourses.find((c) => (c.courseId?._id || c.courseId) === courseId);
      if (course) {
        setCompletedLectures(course.progress?.completedLectures || []);
      }
    }
  }, [enrolledCourses, courseId]);

  // Initial data fetch for the course
  useEffect(() => {
    getCourseData();
  }, [courseId]);

  /**
   * Notify backend that a lecture identifies has been completed by the student
   * @param {string} lectureId 
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
   * Logic to determine percentage of course completion based on total lectures vs completed lectures
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

  // Standard loading screen while data is arriving from API
  if (!courseData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
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
        {/* Main Content Area: YouTube Player + Lecture Description + Q&A */}
        <div className={`flex-1 p-4 md:p-8 ${sidebarOpen ? 'md:mr-80' : ''}`}>
          <div className="bg-black rounded-lg overflow-hidden aspect-video mb-6">
            {currentLecture?.lectureUrl ? (
              <ReactPlayer
                url={currentLecture.lectureUrl}
                controls={true}
                width="100%"
                height="100%"
                onEnded={() => handleLectureComplete(currentLecture?.lectureId)}
                config={{
                  youtube: {
                    playerVars: { showinfo: 1 }
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-lg">
                <p>Video not available</p>
              </div>
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
            </div>

            {/* About Course Section (Truncated Description) */}
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
                        // Change the current video by clicking on Sidebar items
                        onClick={() => setCurrentLecture(lecture)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${isActive
                          ? 'bg-blue-50 border-l-2 border-blue-600'
                          : 'hover:bg-gray-100'
                          }`}
                      >
                        {/* Visual indicator (circle) for active and completion states */}
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
                          <p className="text-xs text-gray-400">
                            {lecture.lectureDuration} min
                          </p>
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
