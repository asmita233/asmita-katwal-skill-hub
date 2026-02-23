import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useAuth } from "@clerk/clerk-react";
import humanizeDuration from "humanize-duration";
import axios from 'axios';
import { toast } from 'react-toastify';

// Create a context for global application state
export const AppContext = createContext();

export const AppContextProvider = (props) => {
    // Basic configurations from environment variables or defaults
    const currency = import.meta.env.VITE_CURRENCY || "$";
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

    // Hooks for programmatic navigation and Clerk authentication
    const navigate = useNavigate();
    const { user } = useUser();
    const { getToken } = useAuth();

    // Application-wide state variables
    const [allCourses, setAllCourses] = useState([]); // List of all available courses
    const [isEducator, setIsEducator] = useState(false); // Whether the current user is an educator
    const [enrolledCourses, setEnrolledCourses] = useState([]); // List of courses the current student is enrolled in
    const [userData, setUserData] = useState(null); // Detailed user data from the backend
    const [loading, setLoading] = useState(true); // Global loading state for initial data fetch
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    // Toggle between light and dark mode
    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    // Apply theme class to document body
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Fetch all courses from the backend API
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

    // Calculate the average rating for a course based on its ratings array
    const calculateRating = (course) => {
        if (!course.courseRatings || course.courseRatings.length === 0) {
            return 0; // Return 0 if no ratings exist
        }
        let totalRating = 0;
        course.courseRatings.forEach((rating) => {
            totalRating += rating.rating;
        });
        // Round to one decimal place
        return Math.round((totalRating / course.courseRatings.length) * 10) / 10;
    };

    // Calculate human-readable time for a single chapter's content
    const calculateChapterTime = (chapter) => {
        let time = 0;
        chapter.chapterContent.forEach((lecture) => {
            time += lecture.lectureDuration;
        });
        // Convert minutes to milliseconds and humanize
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate human-readable total duration for an entire course
    const calculateCourseDuration = (course) => {
        let time = 0;
        course.courseContent.forEach((chapter) => {
            chapter.chapterContent.forEach((lecture) => {
                time += lecture.lectureDuration;
            });
        });
        // Convert total minutes to milliseconds and humanize
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate the total number of lectures across all chapters in a course
    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach((chapter) => {
            if (Array.isArray(chapter.chapterContent)) {
                totalLectures += chapter.chapterContent.length;
            }
        });
        return totalLectures;
    };

    // Fetch the courses that the currently logged-in student is enrolled in
    const fetchEnrolledCourses = async () => {
        try {
            const token = await getToken(); // Get auth token from Clerk
            const { data } = await axios.get(backendUrl + '/api/user/enrolled-courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setEnrolledCourses(Array.isArray(data.enrolledCourses) ? data.enrolledCourses : []);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching enrolled courses:", error);
            toast.error(error.message);
        }
    };

    // Fetch detailed profile data for the logged-in user from the backend
    const fetchUserData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setUserData(data.user);
                // Set the educator status based on the user's role
                setIsEducator(data.user.role === 'educator');
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // API call to change the user's role to 'educator'
    const becomeEducator = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.post(backendUrl + '/api/user/become-educator', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success) {
                setUserData(data.user);
                setIsEducator(true);
                toast.success(data.message);
                navigate('/educator'); // Redirect to educator dashboard
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error becoming educator:", error);
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // Initial load: Fetch all courses regardless of login status
    useEffect(() => {
        fetchAllCourses();
    }, []);

    // Helper to log the Clerk token for debugging purposes
    const logToken = async () => {
        console.log("Clerk Token for debugging:", await getToken());
    }

    // React to user login: Fetch user-specific data when the Clerk user is available
    useEffect(() => {
        if (user) {
            logToken();
            fetchUserData();
            fetchEnrolledCourses();
        }
    }, [user]);

    // Provide all state and functions to the rest of the application
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
        fetchEnrolledCourses,
        becomeEducator,
        theme,
        toggleTheme
    };

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    );
};
