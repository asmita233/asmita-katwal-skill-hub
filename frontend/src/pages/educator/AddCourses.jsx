import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../../context/AppContext';
import { assets } from '../../assets/assets';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import uniqid from 'uniqid';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddCourses = () => {
  const { currency, navigate, backendUrl, getToken } = useContext(AppContext);
  const quillRef = useRef(null);
  const editorRef = useRef(null);

  // Course basic info
  const [courseTitle, setCourseTitle] = useState('');
  const [coursePrice, setCoursePrice] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  // Course content - Chapters and Lectures
  const [chapters, setChapters] = useState([]);
  const [showChapterInput, setShowChapterInput] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // Lecture modal state
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [currentChapterId, setCurrentChapterId] = useState(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureUrl, setLectureUrl] = useState('');
  const [isPreviewFree, setIsPreviewFree] = useState(false);

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

  // Handle thumbnail upload
  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // Add new chapter
  const addChapter = () => {
    if (!newChapterTitle.trim()) return;

    const newChapter = {
      chapterId: uniqid('chapter_'),
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
    setIsPreviewFree(false);
  };

  // Add lecture to chapter
  const addLecture = () => {
    if (!lectureTitle.trim() || !lectureUrl.trim()) return;

    const updatedChapters = chapters.map((chapter) => {
      if (chapter.chapterId === currentChapterId) {
        const newLecture = {
          lectureId: uniqid('lecture_'),
          lectureOrder: chapter.chapterContent.length + 1,
          lectureTitle,
          lectureDuration: parseInt(lectureDuration) || 0,
          lectureUrl,
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await getToken();

      const courseData = {
        courseTitle,
        courseDescription: quillRef.current?.root.innerHTML || '',
        coursePrice: parseFloat(coursePrice),
        discount: parseFloat(discount),
        courseContent: chapters,
      };

      // First create the course
      const { data } = await axios.post(backendUrl + '/api/courses', courseData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data.success) {
        const courseId = data.course._id;

        // Then upload thumbnail if exists
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

        // Finally publish the course
        await axios.patch(`${backendUrl}/api/courses/${courseId}/publish`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        toast.success('Course created and published successfully!');
        navigate('/educator/my-courses');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error(error.response?.data?.message || 'Error creating course. Please try again.');
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

        {/* Price and Discount */}
        <div className="grid grid-cols-2 gap-4">
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
                  Video URL (YouTube)
                </label>
                <input
                  type="url"
                  value={lectureUrl}
                  onChange={(e) => setLectureUrl(e.target.value)}
                  placeholder="https://youtu.be/..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
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
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addLecture}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Lecture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourses;
