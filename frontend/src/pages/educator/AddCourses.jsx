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

  // --- Course Structured Content State (Sections & Lectures) ---
  const [sections, setSections] = useState([]);
  const [showSectionInput, setShowSectionInput] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // --- UI/Modal States for adding lectures ---
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureVideo, setLectureVideo] = useState(null);
  const [lecturePdf, setLecturePdf] = useState(null);
  const [isPreviewFree, setIsPreviewFree] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

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

  // Logic to add a new section to the course content array
  const addSection = () => {
    if (!newSectionTitle.trim()) return;

    const newSection = {
      chapterId: uniqid('section_'), // Generate unique client-side ID
      chapterOrder: sections.length + 1,
      chapterTitle: newSectionTitle,
      chapterContent: [],
    };

    setSections([...sections, newSection]);
    setNewSectionTitle('');
    setShowSectionInput(false);
  };

  // Remove section
  const removeSection = (sectionId) => {
    setSections(sections.filter((ch) => ch.chapterId !== sectionId));
  };

  // Open lecture modal
  const openLectureModal = (sectionId) => {
    setCurrentSectionId(sectionId);
    setShowLectureModal(true);
    setLectureTitle('');
    setLectureDuration('');
    setLectureVideo(null);
    setLecturePdf(null);
    setIsPreviewFree(false);
    setIsUploadingVideo(false);
    setIsUploadingPdf(false);
    setUploadProgress(0);
  };

  // Add lecture to chapter
  const addLecture = async () => {
    // Basic validation
    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }

    if (!lectureVideo) {
      toast.error('Please upload a video file');
      return;
    }

    let finalVideoUrl = '';

    // Upload video file to Cloudinary
    setIsUploadingVideo(true);
    setUploadProgress(0);
    try {
      const token = await getToken();
      const formData = new FormData();
      formData.append('video', lectureVideo);

      const { data } = await axios.post(`${backendUrl}/api/courses/upload-video`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
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

    // --- PDF Upload Logic ---
    let finalPdfUrl = '';
    if (lecturePdf) {
      setIsUploadingPdf(true);
      try {
        const token = await getToken();
        const formData = new FormData();
        formData.append('pdf', lecturePdf);

        const { data } = await axios.post(`${backendUrl}/api/courses/upload-pdf`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });

        if (data.success) {
          finalPdfUrl = data.pdfUrl;
          toast.success('Study material (PDF) uploaded!');
        } else {
          toast.error(data.message || 'PDF upload failed');
          setIsUploadingPdf(false);
          return;
        }
      } catch (error) {
        console.error('Error uploading PDF:', error);
        toast.error(error.response?.data?.message || 'Error uploading PDF');
        setIsUploadingPdf(false);
        return;
      }
    }


    const updatedSections = sections.map((section) => {
      if (section.chapterId === currentSectionId) {
        const newLecture = {
          lectureId: uniqid('lecture_'),
          lectureOrder: section.chapterContent.length + 1,
          lectureTitle,
          lectureDescription: '',
          lectureDuration: parseInt(lectureDuration) || 0,
          lectureUrl: finalVideoUrl,
          lecturePdf: finalPdfUrl,
          isPreviewFree,
        };
        return {
          ...section,
          chapterContent: [...section.chapterContent, newLecture],
        };
      }
      return section;
    });

    setSections(updatedSections);
    setIsUploadingVideo(false);
    setIsUploadingPdf(false);
    setShowLectureModal(false);
  };

  // Remove lecture
  const removeLecture = (sectionId, lectureId) => {
    const updatedSections = sections.map((section) => {
      if (section.chapterId === sectionId) {
        return {
          ...section,
          chapterContent: section.chapterContent.filter(
            (lec) => lec.lectureId !== lectureId
          ),
        };
      }
      return section;
    });
    setSections(updatedSections);
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
        courseContent: sections,
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

        {/* Course Content - Sections */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-medium text-gray-800">Course Content</h2>
              <p className="text-xs text-gray-400 mt-1">Organize your lectures into topic-based sections (e.g., Props in React, State Management, API Integration)</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSectionInput(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium whitespace-nowrap"
            >
              + Add Section
            </button>
          </div>

          {/* Add Section Input */}
          {showSectionInput && (
            <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex-1">
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  placeholder='e.g., "Props in React" or "State Management" or "API Integration"'
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <p className="text-xs text-gray-400 mt-1 ml-1">Give a topic name — students will see this as a section header</p>
              </div>
              <button
                type="button"
                onClick={addSection}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowSectionInput(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 text-sm"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Sections List */}
          <div className="space-y-3">
            {sections.map((section, sectionIndex) => (
              <div
                key={section.chapterId}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Section {sectionIndex + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {section.chapterTitle}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({section.chapterContent.length} {section.chapterContent.length === 1 ? 'lecture' : 'lectures'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openLectureModal(section.chapterId)}
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      + Add Lecture
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.chapterId)}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Lectures */}
                {section.chapterContent.length > 0 && (
                  <div className="px-4 py-2 space-y-2">
                    {section.chapterContent.map((lecture, lectureIndex) => (
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
                              removeLecture(section.chapterId, lecture.lectureId)
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

          {sections.length === 0 && !showSectionInput && (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">No sections added yet</p>
              <p className="text-gray-400 text-sm">Click "+ Add Section" to create topic-based sections like<br/>"Props in React", "useState", "API Integration"</p>
            </div>
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
                  Study Material (PDF)
                </label>
                <div className="flex items-center gap-2">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed rounded-lg cursor-pointer transition ${lecturePdf ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-red-400'} ${isUploadingPdf ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setLecturePdf(e.target.files[0]);
                        }
                      }}
                      disabled={isUploadingPdf}
                    />
                    <svg className="w-5 h-5 text-red-500 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                    <span className="text-sm text-gray-600 truncate">
                      {lecturePdf ? lecturePdf.name : 'Upload Study Material (PDF)'}
                    </span>
                  </label>
                  {lecturePdf && !isUploadingPdf && (
                    <button
                      type="button"
                      onClick={() => setLecturePdf(null)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <img src={assets.cross_icon} alt="" className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Video <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className={`flex-1 flex flex-col items-center justify-center gap-2 px-4 py-5 border-2 border-dashed rounded-lg cursor-pointer transition ${lectureVideo ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-500'} ${isUploadingVideo ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (!file.type.startsWith('video/')) {
                            toast.error('Please select a valid video file');
                            return;
                          }
                          if (file.size > 500 * 1024 * 1024) {
                            toast.error('Video must be less than 500MB');
                            return;
                          }
                          setLectureVideo(file);
                        }
                      }}
                      disabled={isUploadingVideo}
                    />
                    {lectureVideo ? (
                      <>
                        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-blue-700 truncate max-w-[250px]">{lectureVideo.name}</span>
                        <span className="text-xs text-blue-500">{(lectureVideo.size / (1024 * 1024)).toFixed(1)} MB</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-500">Drop video or <span className="text-blue-600 font-medium">browse</span></span>
                        <span className="text-xs text-gray-400">MP4, WebM • Max 500MB</span>
                      </>
                    )}
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

                {/* Upload Progress Bar */}
                {isUploadingVideo && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-blue-600">Uploading video...</span>
                      <span className="text-xs font-bold text-blue-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
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
                {isUploadingVideo || isUploadingPdf ? 'Uploading...' : 'Add Lecture'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCourses;
