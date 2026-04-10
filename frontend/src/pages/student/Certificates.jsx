import React, { useContext, useEffect, useState, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import Footer from '../../components/students/Footer';
import html2canvas from 'html2canvas'; // Captures HTML elements as canvas images
import jsPDF from 'jspdf'; // Generates PDF documents from images/text
import API_BASE_URL from '../../utils/api';

const Certificates = () => {
    // Access global state and navigation helpers
    const { getToken, navigate, user, isEducator, userDataLoading } = useContext(AppContext);

    // UI State Management
    const [certificates, setCertificates] = useState([]); // List of earned certificates
    const [loading, setLoading] = useState(true); // fetching state
    const [selectedCert, setSelectedCert] = useState(null); // The specific certificate currently being 'printed' to PDF
    const [downloading, setDownloading] = useState(false); // PDF generation progress state

    // Ref used to target the hidden DOM element for PDF capture
    const certificateRef = useRef(null);

    /**
     * Retrieve all certificates awarded to the current user
     */
    const fetchCertificates = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${API_BASE_URL}/api/certificates/my-certificates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setCertificates(Array.isArray(data.certificates) ? data.certificates : []);
            } else {
                toast.error(data.message || 'Failed to load certificates');
            }
        } catch (error) {
            console.error('Error fetching certificates:', error);
            const msg = error.response?.data?.message || error.message;
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // Load data only when a valid user session is detected
    useEffect(() => {
        if (userDataLoading) return;
        if (user) {
            if (isEducator) {
                navigate('/educator');
                return;
            }
            fetchCertificates();
        } else {
            setLoading(false);
        }
    }, [user, isEducator, userDataLoading]);

    /**
     * 
     * 3. Embeds that image into a jsPDF document and triggers a browser download
     */
    const downloadCertificate = async (cert) => {
        setSelectedCert(cert); // Triggers the rendering of the hidden template component
        setDownloading(true);

        // Allow a small delay (500ms) for React to finish rendering the hidden template into the DOM
        setTimeout(async () => {
            try {
                const element = certificateRef.current;

                // Convert HTML layout to a Canvas Image (high resolution)
                const canvas = await html2canvas(element, {
                    scale: 2, // High scale for crisp text in the final PDF
                    useCORS: true, // Allows capturing images from external URLs (like user avatars)
                    backgroundColor: '#ffffff'
                });

                const imgData = canvas.toDataURL('image/png');

                // Initialize a Landscape PDF document
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [canvas.width, canvas.height] // Matches the exact size of our captured canvas
                });

                pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
                pdf.save(`Certificate-${cert.courseTitle.replace(/\s+/g, '-')}.pdf`);

                toast.success('Certificate downloaded successfully!');
            } catch (error) {
                console.error('Error downloading certificate:', error);
                toast.error('Failed to download certificate');
            } finally {
                setDownloading(false);
                setSelectedCert(null); // Unmount the hidden template to save memory
            }
        }, 500);
    };

    // Guard: Prevent unauthenticated users from seeing the dashboard
    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Please sign in to view your certificates</h2>
                    <button
                        onClick={() => navigate('/')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-gray-50 py-8 px-4 md:px-8 lg:px-16">
                <div className="max-w-7xl mx-auto">
                    {/* Visual Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Certificates</h1>
                            <p className="text-gray-600">
                                {certificates ? certificates.length : 0} {certificates?.length === 1 ? 'certificate' : 'certificates'} earned
                            </p>
                        </div>
                        <button
                            onClick={fetchCertificates}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm disabled:opacity-50"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                            Sync Progress
                        </button>
                    </div>

                    {/* Dashboard Grid for Certificates */}
                    {certificates?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {certificates?.map((cert) => (
                                <div
                                    key={cert._id}
                                    className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition"
                                >
                                    {/* Preview Card Gradient (visual only) */}
                                    <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white text-center">
                                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                                            </svg>
                                        </div>
                                        <h3 className="font-bold text-lg mb-1">Certificate of Completion</h3>
                                        <p className="text-white/80 text-sm">Successfully completed</p>
                                    </div>

                                    {/* Summary details on the card UI */}
                                    <div className="p-6">
                                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{cert.courseTitle}</h3>
                                        <p className="text-sm text-gray-500 mb-1">
                                            <span className="font-medium">Awarded to:</span> {cert.userName}
                                        </p>
                                        <p className="text-sm text-gray-500 mb-1">
                                            <span className="font-medium">Date:</span> {new Date(cert.completionDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-400 mb-4">
                                            Unique ID: {cert.certificateId}
                                        </p>

                                        {/* Trigger for the high-poly PDF generation */}
                                        <button
                                            onClick={() => downloadCertificate(cert)}
                                            disabled={downloading}
                                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {downloading && selectedCert?._id === cert._id ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                                    </svg>
                                                    Download PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* Placeholder for when no courses are completed yet */
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">No certificates yet</h3>
                            <p className="text-gray-600 mb-6">Complete your enrolled courses to earn certificates</p>
                            <button
                                onClick={() => navigate('/my-enrollments')}
                                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                            >
                                View My Courses
                            </button>
                        </div>
                    )}
                </div>

                {/* --- Hidden Certificate Template for PDF Capture --- 
                    This block is only visible when 'selectedCert' exists.
                    It is rendered far outside the viewport using 'left-[-9999px]'.
                */}
                {selectedCert && (
                    <div className="fixed left-[-9999px]">
                        <div
                            ref={certificateRef}
                            className="w-[1100px] h-[800px] bg-white p-12"
                            style={{ fontFamily: 'Georgia, serif' }}
                        >
                            {/* Formal Certificate Aesthetic: Dual border and center alignment */}
                            <div className="w-full h-full border-8 border-double border-indigo-600 p-8">
                                <div className="w-full h-full border-2 border-indigo-300 p-8 flex flex-col items-center justify-center text-center">
                                    {/* Header / Logo placeholder */}
                                    <div className="mb-6">
                                        <div className="w-20 h-20 mx-auto mb-4">
                                            <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-600">
                                                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="3" />
                                                <path d="M50 15 L55 35 L75 35 L60 50 L65 70 L50 58 L35 70 L40 50 L25 35 L45 35 Z" fill="currentColor" />
                                            </svg>
                                        </div>
                                        <h1 className="text-4xl font-bold text-indigo-700 tracking-wider">CERTIFICATE</h1>
                                        <p className="text-xl text-gray-600 mt-2 tracking-wide">OF COMPLETION</p>
                                    </div>

                                    {/* Dynamic Recipient Name */}
                                    <p className="text-lg text-gray-600 mb-2">This is to certify that</p>
                                    <h2 className="text-4xl font-bold text-gray-800 border-b-2 border-indigo-300 pb-2 mb-4 px-8">
                                        {selectedCert.userName}
                                    </h2>

                                    {/* Dynamic Course Title */}
                                    <p className="text-lg text-gray-600 mb-2">has successfully completed the course</p>
                                    <h3 className="text-2xl font-semibold text-indigo-600 mb-6 max-w-xl">
                                        {selectedCert.courseTitle}
                                    </h3>

                                    {/* Awarded Date */}
                                    <p className="text-gray-600 mb-8">
                                        Completed on {new Date(selectedCert.completionDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>

                                    {/* Unique identifying code for verification */}
                                    <p className="text-sm text-gray-400">
                                        Verify Certificate ID: {selectedCert.certificateId}
                                    </p>

                                    {/* Background decorative watermark opacity elements */}
                                    <div className="absolute bottom-20 left-20 w-24 h-24 opacity-10">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-600">
                                            <circle cx="50" cy="50" r="45" fill="currentColor" />
                                        </svg>
                                    </div>
                                    <div className="absolute bottom-20 right-20 w-24 h-24 opacity-10">
                                        <svg viewBox="0 0 100 100" className="w-full h-full text-indigo-600">
                                            <circle cx="50" cy="50" r="45" fill="currentColor" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <Footer />
        </>
    );
};

export default Certificates;
