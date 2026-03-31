import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import uniqid from 'uniqid';

const EditCourse = () => {
  const { id } = useParams();
  const { backendUrl, getToken, navigate, currency } = useContext(AppContext);

  // Course data
  const [course, setCourse] = useState(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Expanded sections
  const [expandedSections, setExpandedSections] = useState({});

  // Add Section
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  // Edit Section
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState('');

  // Lecture Modal
  const [showLectureModal, setShowLectureModal] = useState(false);
  const [currentSectionId, setCurrentSectionId] = useState(null);
  const [editingLecture, setEditingLecture] = useState(null);
  const [lectureTitle, setLectureTitle] = useState('');
  const [lectureDescription, setLectureDescription] = useState('');
  const [lectureDuration, setLectureDuration] = useState('');
  const [lectureVideo, setLectureVideo] = useState(null);
  const [lecturePdf, setLecturePdf] = useState(null);
  const [isPreviewFree, setIsPreviewFree] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);

  // Drag and drop
  const [draggedSection, setDraggedSection] = useState(null);
  const [draggedLecture, setDraggedLecture] = useState(null);
  const [dragOverSection, setDragOverSection] = useState(null);
  const [dragOverLecture, setDragOverLecture] = useState(null);

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'section' or 'lecture'
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ============================================================
  // FETCH COURSE DATA
  // ============================================================
  const fetchCourse = useCallback(async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setCourse(data.course);
        setSections(data.course.courseContent || []);
        // Expand first section by default
        if (data.course.courseContent?.length > 0) {
          setExpandedSections({ [data.course.courseContent[0].chapterId]: true });
        }
      }
    } catch (error) {
      toast.error('Failed to load course');
      navigate('/educator/my-courses');
    } finally {
      setLoading(false);
    }
  }, [id, backendUrl, getToken, navigate]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // ============================================================
  // SAVE ALL CONTENT
  // ============================================================
  const saveContent = async (updatedSections) => {
    setSaving(true);
    try {
      const token = await getToken();
      const { data } = await axios.put(
        `${backendUrl}/api/courses/${id}/content`,
        { courseContent: updatedSections || sections },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        setCourse(data.course);
        setSections(data.course.courseContent);
        toast.success('Content saved successfully!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save content');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // SECTION MANAGEMENT
  // ============================================================
  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const addSection = () => {
    if (!newSectionTitle.trim()) {
      toast.error('Please enter a section title');
      return;
    }

    const newSection = {
      chapterId: uniqid('section_'),
      chapterOrder: sections.length + 1,
      chapterTitle: newSectionTitle.trim(),
      chapterContent: [],
    };

    const updated = [...sections, newSection];
    setSections(updated);
    setExpandedSections(prev => ({ ...prev, [newSection.chapterId]: true }));
    setNewSectionTitle('');
    setShowAddSection(false);
    saveContent(updated);
  };

  const startEditSection = (section) => {
    setEditingSectionId(section.chapterId);
    setEditingSectionTitle(section.chapterTitle);
  };

  const saveEditSection = () => {
    if (!editingSectionTitle.trim()) return;

    const updated = sections.map((s) =>
      s.chapterId === editingSectionId
        ? { ...s, chapterTitle: editingSectionTitle.trim() }
        : s
    );
    setSections(updated);
    setEditingSectionId(null);
    saveContent(updated);
  };

  const confirmDeleteSection = (section) => {
    setDeleteType('section');
    setDeleteTarget(section);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLecture = (sectionId, lecture) => {
    setDeleteType('lecture');
    setDeleteTarget({ sectionId, lecture });
    setShowDeleteConfirm(true);
  };

  const executeDelete = () => {
    let updated;
    if (deleteType === 'section') {
      updated = sections
        .filter((s) => s.chapterId !== deleteTarget.chapterId)
        .map((s, idx) => ({ ...s, chapterOrder: idx + 1 }));
    } else {
      updated = sections.map((s) => {
        if (s.chapterId === deleteTarget.sectionId) {
          return {
            ...s,
            chapterContent: s.chapterContent
              .filter((l) => l.lectureId !== deleteTarget.lecture.lectureId)
              .map((l, idx) => ({ ...l, lectureOrder: idx + 1 })),
          };
        }
        return s;
      });
    }
    setSections(updated);
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
    setDeleteType(null);
    saveContent(updated);
  };

  // ============================================================
  // LECTURE MANAGEMENT
  // ============================================================
  const openAddLecture = (sectionId) => {
    setCurrentSectionId(sectionId);
    setEditingLecture(null);
    setLectureTitle('');
    setLectureDescription('');
    setLectureDuration('');
    setLectureVideo(null);
    setLecturePdf(null);
    setIsPreviewFree(false);
    setUploadProgress(0);
    setIsUploading(false);
    setIsPdfUploading(false);
    setShowLectureModal(true);
  };

  const openEditLecture = (sectionId, lecture) => {
    setCurrentSectionId(sectionId);
    setEditingLecture(lecture);
    setLectureTitle(lecture.lectureTitle);
    setLectureDescription(lecture.lectureDescription || '');
    setLectureDuration(lecture.lectureDuration?.toString() || '');
    setLectureVideo(null);
    setLecturePdf(null);
    setIsPreviewFree(lecture.isPreviewFree || false);
    setUploadProgress(0);
    setIsUploading(false);
    setIsPdfUploading(false);
    setShowLectureModal(true);
  };

  const handleSaveLecture = async () => {
    if (!lectureTitle.trim()) {
      toast.error('Please enter a lecture title');
      return;
    }

    if (!editingLecture && !lectureVideo) {
      toast.error('Please upload a video file');
      return;
    }

    let finalVideoUrl = '';
    let finalPdfUrl = editingLecture?.lecturePdf || '';

    // Upload video if selected
    if (lectureVideo) {
      setIsUploading(true);
      setUploadProgress(0);
      try {
        const token = await getToken();
        const formData = new FormData();
        formData.append('video', lectureVideo);

        const { data } = await axios.post(
          `${backendUrl}/api/courses/upload-video`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            },
          }
        );

        if (data.success) {
          finalVideoUrl = data.videoUrl;
          toast.success('Video uploaded!');
        } else {
          toast.error(data.message || 'Video upload failed');
          setIsUploading(false);
          return;
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Video upload error');
        setIsUploading(false);
        return;
      }
    }

    // Upload PDF if selected
    if (lecturePdf) {
      setIsPdfUploading(true);
      try {
        const token = await getToken();
        const formData = new FormData();
        formData.append('pdf', lecturePdf);

        const { data } = await axios.post(
          `${backendUrl}/api/courses/upload-pdf`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        if (data.success) {
          finalPdfUrl = data.pdfUrl;
          toast.success('Study material uploaded!');
        } else {
          toast.error(data.message || 'PDF upload failed');
          setIsPdfUploading(false);
          return;
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'PDF upload error');
        setIsPdfUploading(false);
        return;
      }
    }

    // Update sections
    const updated = sections.map((section) => {
      if (section.chapterId !== currentSectionId) return section;

      if (editingLecture) {
        // Edit existing lecture
        return {
          ...section,
          chapterContent: section.chapterContent.map((lec) =>
            lec.lectureId === editingLecture.lectureId
              ? {
                  ...lec,
                  lectureTitle: lectureTitle.trim(),
                  lectureDescription: lectureDescription.trim(),
                  lectureDuration: parseInt(lectureDuration) || 0,
                  lectureUrl: finalVideoUrl || lec.lectureUrl,
                  lecturePdf: finalPdfUrl,
                  isPreviewFree,
                }
              : lec
          ),
        };
      } else {
        // Add new lecture
        const newLecture = {
          lectureId: uniqid('lecture_'),
          lectureOrder: section.chapterContent.length + 1,
          lectureTitle: lectureTitle.trim(),
          lectureDescription: lectureDescription.trim(),
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
    });

    setSections(updated);
    setIsUploading(false);
    setIsPdfUploading(false);
    setShowLectureModal(false);
    saveContent(updated);
  };

  // ============================================================
  // DRAG AND DROP - SECTIONS
  // ============================================================
  const handleSectionDragStart = (e, sectionIdx) => {
    setDraggedSection(sectionIdx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `section-${sectionIdx}`);
  };

  const handleSectionDragOver = (e, sectionIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSection(sectionIdx);
  };

  const handleSectionDrop = (e, targetIdx) => {
    e.preventDefault();
    if (draggedSection === null || draggedSection === targetIdx) {
      setDraggedSection(null);
      setDragOverSection(null);
      return;
    }

    const updated = [...sections];
    const [movedSection] = updated.splice(draggedSection, 1);
    updated.splice(targetIdx, 0, movedSection);

    // Re-order
    updated.forEach((s, idx) => {
      s.chapterOrder = idx + 1;
    });

    setSections(updated);
    setDraggedSection(null);
    setDragOverSection(null);
    saveContent(updated);
  };

  // ============================================================
  // DRAG AND DROP - LECTURES
  // ============================================================
  const handleLectureDragStart = (e, sectionId, lectureIdx) => {
    setDraggedLecture({ sectionId, lectureIdx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `lecture-${sectionId}-${lectureIdx}`);
    e.stopPropagation();
  };

  const handleLectureDragOver = (e, sectionId, lectureIdx) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverLecture({ sectionId, lectureIdx });
    e.stopPropagation();
  };

  const handleLectureDrop = (e, targetSectionId, targetLectureIdx) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedLecture) return;

    const { sectionId: srcSectionId, lectureIdx: srcLectureIdx } = draggedLecture;

    const updated = sections.map((s) => ({
      ...s,
      chapterContent: [...s.chapterContent],
    }));

    const srcSection = updated.find((s) => s.chapterId === srcSectionId);
    const targetSection = updated.find((s) => s.chapterId === targetSectionId);

    if (!srcSection || !targetSection) return;

    const [movedLecture] = srcSection.chapterContent.splice(srcLectureIdx, 1);
    targetSection.chapterContent.splice(targetLectureIdx, 0, movedLecture);

    // Re-order lectures in affected sections
    srcSection.chapterContent.forEach((l, idx) => { l.lectureOrder = idx + 1; });
    targetSection.chapterContent.forEach((l, idx) => { l.lectureOrder = idx + 1; });

    setSections(updated);
    setDraggedLecture(null);
    setDragOverLecture(null);
    saveContent(updated);
  };

  // ============================================================
  // STATS
  // ============================================================
  const totalLectures = sections.reduce(
    (acc, s) => acc + (s.chapterContent?.length || 0),
    0
  );
  const totalDuration = sections.reduce((acc, s) => {
    return (
      acc +
      (s.chapterContent?.reduce(
        (a, l) => a + (Number(l.lectureDuration) || 0),
        0
      ) || 0)
    );
  }, 0);

  // ============================================================
  // RENDER
  // ============================================================
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/educator/my-courses')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium mb-3 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Courses
          </button>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Course Content Manager
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{course.courseTitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => saveContent()}
            disabled={saving}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
              saving
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-black hover:shadow-lg hover:-translate-y-0.5'
            }`}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </span>
            ) : (
              'Save All Changes'
            )}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-2xl p-5">
          <div className="text-3xl font-black text-purple-600">{sections.length}</div>
          <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mt-1">Sections</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5">
          <div className="text-3xl font-black text-blue-600">{totalLectures}</div>
          <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-1">Lectures</div>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5">
          <div className="text-3xl font-black text-emerald-600">
            {totalDuration >= 60
              ? `${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m`
              : `${totalDuration}m`}
          </div>
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mt-1">Total Duration</div>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section, sectionIdx) => (
          <div
            key={section.chapterId}
            draggable
            onDragStart={(e) => handleSectionDragStart(e, sectionIdx)}
            onDragOver={(e) => handleSectionDragOver(e, sectionIdx)}
            onDrop={(e) => handleSectionDrop(e, sectionIdx)}
            onDragEnd={() => { setDraggedSection(null); setDragOverSection(null); }}
            className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
              dragOverSection === sectionIdx && draggedSection !== sectionIdx
                ? 'border-purple-400 shadow-lg shadow-purple-100 scale-[1.01]'
                : draggedSection === sectionIdx
                ? 'opacity-50 border-gray-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* Section Header */}
            <div className="bg-gray-50/80 px-5 py-4 flex items-center justify-between group">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Drag Handle */}
                <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition flex-shrink-0">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="9" cy="6" r="1.5" />
                    <circle cx="15" cy="6" r="1.5" />
                    <circle cx="9" cy="12" r="1.5" />
                    <circle cx="15" cy="12" r="1.5" />
                    <circle cx="9" cy="18" r="1.5" />
                    <circle cx="15" cy="18" r="1.5" />
                  </svg>
                </div>

                {/* Toggle Arrow */}
                <button
                  onClick={() => toggleSection(section.chapterId)}
                  className="flex-shrink-0"
                >
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      expandedSections[section.chapterId] ? 'rotate-90' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Section Title */}
                {editingSectionId === section.chapterId ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingSectionTitle}
                      onChange={(e) => setEditingSectionTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveEditSection()}
                      className="flex-1 px-3 py-1.5 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      autoFocus
                    />
                    <button
                      onClick={saveEditSection}
                      className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingSectionId(null)}
                      className="px-3 py-1.5 text-gray-500 text-xs font-bold hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggleSection(section.chapterId)}
                  >
                    <span className="font-bold text-gray-800 truncate">
                      Section {sectionIdx + 1}: {section.chapterTitle}
                    </span>
                    <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                      {section.chapterContent?.length || 0} lecture{(section.chapterContent?.length || 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Section Actions */}
              {editingSectionId !== section.chapterId && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <button
                    onClick={() => openAddLecture(section.chapterId)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Add Lecture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startEditSection(section)}
                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition"
                    title="Edit Section"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => confirmDeleteSection(section)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Delete Section"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Lectures List */}
            {expandedSections[section.chapterId] && (
              <div className="bg-white">
                {section.chapterContent?.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {section.chapterContent.map((lecture, lectureIdx) => (
                      <div
                        key={lecture.lectureId}
                        draggable
                        onDragStart={(e) => handleLectureDragStart(e, section.chapterId, lectureIdx)}
                        onDragOver={(e) => handleLectureDragOver(e, section.chapterId, lectureIdx)}
                        onDrop={(e) => handleLectureDrop(e, section.chapterId, lectureIdx)}
                        onDragEnd={() => { setDraggedLecture(null); setDragOverLecture(null); }}
                        className={`flex items-center gap-3 px-5 py-3.5 group/lec hover:bg-gray-50/50 transition ${
                          dragOverLecture?.sectionId === section.chapterId &&
                          dragOverLecture?.lectureIdx === lectureIdx
                            ? 'bg-blue-50 border-l-4 border-blue-400'
                            : ''
                        }`}
                      >
                        {/* Drag Handle */}
                        <div className="cursor-grab active:cursor-grabbing text-gray-200 hover:text-gray-400 transition flex-shrink-0 pl-4">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="9" cy="6" r="1.5" />
                            <circle cx="15" cy="6" r="1.5" />
                            <circle cx="9" cy="12" r="1.5" />
                            <circle cx="15" cy="12" r="1.5" />
                          </svg>
                        </div>

                        {/* Play Icon */}
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3.5 h-3.5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>

                        {/* Lecture Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-800 truncate">
                              {lecture.lectureTitle}
                            </span>
                            {lecture.isPreviewFree && (
                              <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase">
                                Free
                              </span>
                            )}
                            {lecture.lecturePdf && (
                              <span className="text-[10px] bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold uppercase">
                                PDF
                              </span>
                            )}
                          </div>
                          {lecture.lectureDescription && (
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {lecture.lectureDescription}
                            </p>
                          )}
                        </div>

                        {/* Duration */}
                        <span className="text-xs text-gray-400 font-medium flex-shrink-0">
                          {lecture.lectureDuration > 0 ? `${lecture.lectureDuration} min` : '--'}
                        </span>

                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover/lec:opacity-100 transition-opacity flex-shrink-0">
                          <button
                            onClick={() => openEditLecture(section.chapterId, lecture)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => confirmDeleteLecture(section.chapterId, lecture)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <svg className="w-10 h-10 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">No lectures yet</p>
                    <button
                      onClick={() => openAddLecture(section.chapterId)}
                      className="mt-2 text-sm text-purple-600 hover:text-purple-700 font-bold"
                    >
                      + Add your first lecture
                    </button>
                  </div>
                )}

                {/* Add Lecture Button (Footer) */}
                {section.chapterContent?.length > 0 && (
                  <button
                    onClick={() => openAddLecture(section.chapterId)}
                    className="w-full px-5 py-3 text-sm text-purple-600 hover:bg-purple-50 font-bold transition border-t border-gray-100 flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Lecture
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Section */}
      {showAddSection ? (
        <div className="mt-4 p-5 border-2 border-dashed border-purple-200 rounded-2xl bg-purple-50/30">
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addSection()}
            placeholder='e.g., "Props in React", "State Management" or "API Integration"'
            className="w-full px-4 py-3 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-400 outline-none text-sm bg-white"
            autoFocus
          />
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={addSection}
              className="px-5 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition"
            >
              Add Section
            </button>
            <button
              onClick={() => { setShowAddSection(false); setNewSectionTitle(''); }}
              className="px-5 py-2 text-gray-500 text-sm font-bold hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSection(true)}
          className="mt-4 w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:text-purple-600 hover:border-purple-300 hover:bg-purple-50/30 font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Section
        </button>
      )}

      {sections.length === 0 && !showAddSection && (
        <div className="mt-8 text-center py-16 bg-gray-50/50 rounded-2xl border border-gray-100">
          <div className="w-20 h-20 bg-purple-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Start Building Your Course</h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto text-sm">
            Organize your course into topic-based sections (like "Props in React", "useState") and add video lectures to each section to make it easier for students to learn.
          </p>
          <button
            onClick={() => setShowAddSection(true)}
            className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all hover:shadow-lg"
          >
            + Add Your First Section
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* LECTURE MODAL */}
      {/* ============================================================ */}
      {showLectureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">
                {editingLecture ? 'Edit Lecture' : 'Add New Lecture'}
              </h3>
              <button
                onClick={() => setShowLectureModal(false)}
                disabled={isUploading || isPdfUploading}
                className="p-2 hover:bg-gray-100 rounded-xl transition"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Lecture Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  placeholder="e.g., Introduction to Arrays in Java"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={lectureDescription}
                  onChange={(e) => setLectureDescription(e.target.value)}
                  placeholder="Brief description of what this lecture covers..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm resize-none"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={lectureDuration}
                  onChange={(e) => setLectureDuration(e.target.value)}
                  placeholder="e.g., 15"
                  min="0"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none text-sm"
                />
              </div>

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Upload Video {!editingLecture && <span className="text-red-500">*</span>}
                </label>

                {/* File Upload */}
                <label
                  className={`flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    lectureVideo
                      ? 'border-purple-400 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/20'
                  } ${isUploading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (!file.type.startsWith('video/')) {
                          toast.error('Please select a valid video file (mp4, webm, etc.)');
                          return;
                        }
                        if (file.size > 500 * 1024 * 1024) {
                          toast.error('Video file must be less than 500MB');
                          return;
                        }
                        setLectureVideo(file);
                      }
                    }}
                    disabled={isUploading}
                  />
                  {lectureVideo ? (
                    <>
                      <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm font-bold text-purple-700">{lectureVideo.name}</span>
                      <span className="text-xs text-purple-500">
                        {(lectureVideo.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                    </>
                  ) : (
                    <>
                      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-500 font-medium">
                        Drop video file or <span className="text-purple-600 font-bold">browse</span>
                      </span>
                      <span className="text-xs text-gray-400">MP4, WebM • Max 500MB</span>
                    </>
                  )}
                </label>

                {/* Clear video button */}
                {lectureVideo && !isUploading && (
                  <button
                    onClick={() => setLectureVideo(null)}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 font-bold"
                  >
                    Remove selected video
                  </button>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-purple-600">Uploading video...</span>
                      <span className="text-xs font-bold text-purple-600">{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {editingLecture?.lectureUrl && !lectureVideo && !lectureUrl && (
                  <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    Current video will be kept
                  </div>
                )}
              </div>

              {/* PDF Upload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">
                  Study Material (PDF)
                </label>
                <label
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition ${
                    lecturePdf
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files[0]) setLecturePdf(e.target.files[0]);
                    }}
                    disabled={isPdfUploading}
                  />
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-500 truncate">
                    {lecturePdf ? lecturePdf.name : 'Attach study material (Optional)'}
                  </span>
                </label>
                {lecturePdf && !isPdfUploading && (
                  <button
                    onClick={() => setLecturePdf(null)}
                    className="mt-1 text-xs text-red-500 font-bold"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Free Preview Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="previewFree"
                  checked={isPreviewFree}
                  onChange={(e) => setIsPreviewFree(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-400"
                />
                <label htmlFor="previewFree" className="flex-1">
                  <span className="text-sm font-bold text-gray-700 block">Free Preview</span>
                  <span className="text-xs text-gray-400">Allow non-enrolled users to watch this lecture</span>
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLectureModal(false)}
                disabled={isUploading || isPdfUploading}
                className="px-5 py-2.5 text-gray-500 font-bold text-sm hover:text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLecture}
                disabled={isUploading || isPdfUploading}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isUploading || isPdfUploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-lg'
                }`}
              >
                {isUploading || isPdfUploading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Uploading...
                  </span>
                ) : editingLecture ? (
                  'Save Changes'
                ) : (
                  'Add Lecture'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Delete {deleteType === 'section' ? 'Section' : 'Lecture'}?
              </h3>
              <p className="text-sm text-gray-500 mb-1">
                {deleteType === 'section'
                  ? `"${deleteTarget?.chapterTitle}" and all its lectures will be permanently deleted.`
                  : `"${deleteTarget?.lecture?.lectureTitle}" will be permanently deleted.`}
              </p>
              <p className="text-xs text-gray-400 mt-2">This action cannot be undone.</p>
            </div>
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition text-sm font-bold"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCourse;
