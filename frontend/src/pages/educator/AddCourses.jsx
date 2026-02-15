import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import { useClerk, useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import uniqid from 'uniqid';

const AddCourses = () => {
  const { currency, navigate, backendUrl, getToken } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // --- Course Basic Information State ---
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [category, setCategory] = useState('Programming');
  const [level, setLevel] = useState('Beginner');
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // --- Course Structured Content State (Chapters & Lectures) ---
  const [chapters, setChapters] = useState([]);
  const [showChapterInput, setShowChapterInput] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // --- UI/Modal States for adding lectures ---
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureUrl, setLectureUrl] = useState('');
  const [lectureVideo, setLectureVideo] = useState(null);
  const [isPreviewFree, setIsPreviewFree] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  // Global loading state for API requests
  const [loading, setLoading] = useState(false);

  // Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: 'snow',
        placeholder: 'Write course description here...',
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link'],
            ['clean'],
          ],
        },
      });
    }
  }, []);

  // --- Helper Methods for UI Interaction ---

  // Handle local image file selection and create a preview URL
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // Logic to add a new chapter to the course content array
  const addChapter = () => {
    if (!newChapterTitle.trim()) return;

    const newChapter = {
      chapterId: uniqid('chapter_'), // Generate unique client-side ID
      chapterOrder: chapters.length + 1,
      chapterTitle: newChapterTitle,
      chapterContent: [],
    };

    setChapters([...chapters, newChapter]);
    setNewChapterTitle('');
    setShowChapterInput(false);
  };

  // Remove chapter
  const removeChapter = (chapterId) => {
    setChapters(chapters.filter((ch) => ch.chapterId !== chapterId));
  };

  // Open lecture modal
  const openLectureModal = (chapterId) => {
    setCurrentChapterId(chapterId);
    setShowLectureModal(true);
    setLectureTitle('');
    setLectureDuration('');
    setLectureUrl('');
    setLectureVideo(null);
    setIsPreviewFree(false);
    setIsUploadingVideo(false);
  };

  // Add lecture to chapter
  const addLecture = async () => {
    // Basic validation
    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }

    if (!lectureUrl.trim() && !lectureVideo) {
      toast.error('Please provide a video URL or upload a video file');
      return;
    }

    let finalVideoUrl = lectureUrl;

    // If a video file is selected, upload it first
    if (lectureVideo) {
      setIsUploadingVideo(true);
      try {
        const token = await getToken();
        const formData = new FormData();
        formData.append('video', lectureVideo);

        const { data } = await axios.post(`${backendUrl}/api/courses/upload-video`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          // Track upload progress if possible (optional but nice)
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Upload progress: ${percentCompleted}%`);
          }
        });

        if (data.success) {
          finalVideoUrl = data.videoUrl;
          toast.success('Video uploaded successfully');
        } else {
          toast.error(data.message || 'Video upload failed');
          setIsUploadingVideo(false);
          return;
        }
      } catch (error) {
        console.error('Error uploading video:', error);
        toast.error(error.response?.data?.message || 'Error uploading video');
        setIsUploadingVideo(false);
        return;
      }
    }

    const updatedChapters = chapters.map((chapter) => {
      if (chapter.chapterId === currentChapterId) {
        const newLecture = {
          lectureId: uniqid('lecture_'),
          lectureOrder: chapter.chapterContent.length + 1,
          lectureTitle,
          lectureDuration: parseInt(lectureDuration) || 0,
          lectureUrl: finalVideoUrl,
          isPreviewFree,
        };
        return {
          ...chapter,
          chapterContent: [...chapter.chapterContent, newLecture],
        };
      }
      return chapter;
    });

    setChapters(updatedChapters);
    setIsUploadingVideo(false);
    setShowLectureModal(false);
  };

  // Remove lecture
  const removeLecture = (chapterId, lectureId) => {
    const updatedChapters = chapters.map((chapter) => {
      if (chapter.chapterId === chapterId) {
        return {
          ...chapter,
          chapterContent: chapter.chapterContent.filter(
            (lec) => lec.lectureId !== lectureId
          ),
        };
      }
      return chapter;
    });
    setChapters(updatedChapters);
  };

  // --- Final Form Submission ---
  // This process is multi-step: 
  // 1. Create the course record
  // 2. Upload thumbnail to a separate endpoint (if provided)
  // 3. Officially publish the course
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();

      if (!token) {
        toast.error('You must be logged in to create a course');
        setLoading(false);
        return;
      }

      // Prepare payload with descriptive HTML from Quill
      const courseData = {
        courseTitle,
        courseDescription: quillRef.current?.root.innerHTML || '',
        coursePrice: parseFloat(coursePrice),
        discount: parseFloat(discount),
        category,
        level,
        courseContent: chapters,
      };

      // Step 1: Initial Course Creation
      const { data } = await axios.post(backendUrl + '/api/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const courseId = data.course._id;

        // Step 2: Handle Thumbnail Upload using FormData
        if (thumbnail) {
          const formData = new FormData();
          formData.append('thumbnail', thumbnail);

          await axios.post(`${backendUrl}/api/courses/${courseId}/thumbnail`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });
        }

        // Step 3: Patch request to mark the course as 'published'
        await axios.patch(`${backendUrl}/api/courses/${courseId}/publish`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Course created and published successfully!');
        navigate('/educator/my-courses');
      } else {
        toast.error(data.message || 'Failed to create course');
      }
    } catch (error) {
      console.error('Error creating course:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.details?.join(', ') || error.message || 'Error creating course.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Add New Course</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Title
          </label>
          <input
            type="text"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            placeholder="Enter course title"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          />
        </div>

        {/* Course Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Description
          </label>
          <div
            ref={editorRef}
            className="bg-white border border-gray-300 rounded-lg min-h-[200px]"
          />
        </div>

        {/* Price, Discount, Category, Level */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Course Price ({currency})
            </label>
            <input
              type="number"
              value={coursePrice}
              onChange={(e) => setCoursePrice(e.target.value)}
              placeholder="0"
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount (%)
            </label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Programming">Programming</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Business">Business</option>
              <option value="Cybersecurity">Cybersecurity</option>
              <option value="Personal Development">Personal Development</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Level
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>
        </div>

        {/* Course Thumbnail */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course Thumbnail
          </label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleThumbnailChange}
                className="hidden"
              />
              <div className="w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 transition">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <img
                    src={assets.file_upload_icon}
                    alt="Upload"
                    className="w-8 h-8 opacity-50"
                  />
                )}
              </div>
            </label>
            {thumbnailPreview && (
              <button
                type="button"
                onClick={() => {
                  setThumbnail(null);
                  setThumbnailPreview(null);
                }}
                className="text-red-500 text-sm hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Course Content - Chapters */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-800">Course Content</h2>
            <button
              type="button"
              onClick={() => setShowChapterInput(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              + Add Chapter
            </button>
          </div>

          {/* Add Chapter Input */}
          {showChapterInput && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
              <input
                type="text"
                value={newChapterTitle}
                onChange={(e) => setNewChapterTitle(e.target.value)}
                placeholder="Enter chapter title"
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <button
                type="button"
                onClick={addChapter}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowChapterInput(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Chapters List */}
          <div className="space-y-3">
            {chapters.map((chapter, chapterIndex) => (
              <div
                key={chapter.chapterId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Chapter Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">
                      {chapterIndex + 1}. {chapter.chapterTitle}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({chapter.chapterContent.length} lectures)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openLectureModal(chapter.chapterId)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add Lecture
                    </button>
                    <button
                      type="button"
                      onClick={() => removeChapter(chapter.chapterId)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Lectures */}
                {chapter.chapterContent.length > 0 && (
                  <div className="px-4 py-2 space-y-2">
                    {chapter.chapterContent.map((lecture, lectureIndex) => (
                      <div
                        key={lecture.lectureId}
                        className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={assets.play_icon}
                            alt="play"
                            className="w-4 h-4 opacity-60"
                          />
                          <span className="text-sm text-gray-700">
                            {lecture.lectureTitle}
                          </span>
                          {lecture.isPreviewFree && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                              Free Preview
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500">
                            {lecture.lectureDuration} min
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              removeLecture(chapter.chapterId, lecture.lectureId)
                            }
                            className="text-red-500 hover:text-red-600"
                          >
                            <img
                              src={assets.cross_icon}
                              alt="remove"
                              className="w-3 h-3"
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {chapters.length === 0 && !showChapterInput && (
            <p className="text-center text-gray-500 py-8">
              No chapters added yet. Click "Add Chapter" to start.
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium transition ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
              }`}
          >
            {loading ? 'Creating...' : 'ADD'}
          </button>
        </div>
      </form>

      {/* Add Lecture Modal */}
      {showLectureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-800 mb-4">
              Add New Lecture
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lecture Title
                </label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="Enter lecture title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={lectureDuration}
                  onChange={(e) => setLectureDuration(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Video Option
                </label>
                <div className="space-y-3">
                  {/* URL Option */}
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Option 1: Video URL (YouTube)</span>
                    <input
                      type="url"
                      value={lectureUrl}
                      onChange={(e) => {
                        setLectureUrl(e.target.value);
                        if (e.target.value) setLectureVideo(null);
                      }}
                      placeholder="https://youtu.be/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      disabled={isUploadingVideo || !!lectureVideo}
                    />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-2">
                    <hr className="flex-1 border-gray-200" />
                    <span className="text-[10px] text-gray-400 font-bold">OR</span>
                    <hr className="flex-1 border-gray-200" />
                  </div>

                  {/* File Upload Option */}
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Option 2: Upload Video File</span>
                    <div className="flex items-center gap-2">
                      <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition ${lectureVideo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'} ${isUploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files[0]) {
                              setLectureVideo(e.target.files[0]);
                              setLectureUrl('');
                            }
                          }}
                          disabled={isUploadingVideo}
                        />
                        <img src={assets.file_upload_icon} alt="" className="w-4 h-4 opacity-70" />
                        <span className="text-sm text-gray-600 truncate">
                          {lectureVideo ? lectureVideo.name : 'Select Video File'}
                        </span>
                      </label>
                      {lectureVideo && !isUploadingVideo && (
                        <button
                          type="button"
                          onClick={() => setLectureVideo(null)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <img src={assets.cross_icon} alt="" className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPreviewFree"
                  checked={isPreviewFree}
                  onChange={(e) => setIsPreviewFree(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label
                  htmlFor="isPreviewFree"
                  className="text-sm text-gray-700"
                >
                  Make this lecture free for preview
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowLectureModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isUploadingVideo}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLecture}
                disabled={isUploadingVideo}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg transition ${isUploadingVideo ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}`}
              >
                {isUploadingVideo ? 'Uploading...' : 'Add Lecture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourses;
