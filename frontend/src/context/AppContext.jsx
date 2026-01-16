import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";
import axios from 'axios';
import { toast } from 'react-toastify';

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const currency = import.meta.env.VITE_CURRENCY || "$";
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
    const navigate = useNavigate();
    const { user } = useUser();
    const { getToken } = useAuth();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch all courses from backend
    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/courses');
            if (data.success) {
                setAllCourses(data.courses);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching courses:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate average rating for a course
    const calculateRating = (course) => {
        if (!course.courseRatings || course.courseRatings.length === 0) {
            return 0;
        }
        let totalRating = 0;
        course.courseRatings.forEach((rating) => {
            totalRating += rating.rating;
        });
        return Math.round((totalRating / course.courseRatings.length) * 10) / 10;
    };

    // Calculate chapter time
    const calculateChapterTime = (chapter) => {
        let time = 0;
        chapter.chapterContent.forEach((lecture) => {
            time += lecture.lectureDuration;
        });
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate course duration
    const calculateCourseDuration = (course) => {
        let time = 0;
        course.courseContent.forEach((chapter) => {
            chapter.chapterContent.forEach((lecture) => {
                time += lecture.lectureDuration;
            });
        });
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate total lectures
    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach((chapter) => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    };

    // Fetch enrolled courses from backend
    const fetchEnrolledCourses = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/user/enrolled-courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setEnrolledCourses(data.enrolledCourses);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching enrolled courses:", error);
            toast.error(error.message);
        }
    };

    // Fetch user data from backend
    const fetchUserData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setUserData(data.user);
                setIsEducator(data.user.role === 'educator');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
            // Don't toast error here as it might triggered before webhook syncs
        }
    };

    useEffect(() => {
        fetchAllCourses();
    }, []);

    useEffect(() => {
        if (user) {
            fetchUserData();
            fetchEnrolledCourses();
        }
    }, [user]);

    const value = {
        currency,
        backendUrl,
        allCourses,
        setAllCourses,
        navigate,
        calculateRating,
        calculateChapterTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        isEducator,
        setIsEducator,
        enrolledCourses,
        setEnrolledCourses,
        userData,
        setUserData,
        loading,
        user,
        getToken,
        fetchAllCourses,
        fetchEnrolledCourses
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
