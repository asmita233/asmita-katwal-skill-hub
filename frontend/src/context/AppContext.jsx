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
    const rawBackendUrl = import.meta.env.VITE_BACKEND_URL?.trim();
    const isLocalBackendUrl = (url) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(url);
    const backendUrl = import.meta.env.DEV && (!rawBackendUrl || isLocalBackendUrl(rawBackendUrl))
        ? 'http://127.0.0.1:5000'
        : (rawBackendUrl || '');

    // Hooks for programmatic navigation and Clerk authentication
    const navigate = useNavigate();
    const { user, isLoaded } = useUser();
    const { getToken } = useAuth();

    // Application-wide state variables
    const [allCourses, setAllCourses] = useState([]); // List of all available courses
    const [isEducator, setIsEducator] = useState(false); // Whether the current user is an educator
    const [enrolledCourses, setEnrolledCourses] = useState([]); // List of courses the current student is enrolled in
    const [userData, setUserData] = useState(null); // Detailed user data from the backend
    const [userDataLoading, setUserDataLoading] = useState(true); // Whether the current user's profile is still loading
    const [loading, setLoading] = useState(true); // Global loading state for initial data fetch
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

    const isNetworkError = (error) => error?.code === 'ERR_NETWORK' || error?.message === 'Network Error';

    const getApiErrorMessage = (error, fallbackMessage) => {
        if (error?.response?.data?.message) {
            return error.response.data.message;
        }

        if (isNetworkError(error)) {
            return 'Backend server is unreachable. Start the server and try again.';
        }

        return error?.message || fallbackMessage;
    };

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
            if (!isNetworkError(error)) {
                toast.error(getApiErrorMessage(error, 'Failed to load courses'));
            }
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

    // Calculate human-readable time for a single section's content
    const calculateSectionTime = (section) => {
        let time = 0;
        section.chapterContent.forEach((lecture) => {
            time += lecture.lectureDuration;
        });
        // Convert minutes to milliseconds and humanize
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate human-readable total duration for an entire course
    const calculateCourseDuration = (course) => {
        let time = 0;
        course.courseContent.forEach((section) => {
            section.chapterContent.forEach((lecture) => {
                time += lecture.lectureDuration;
            });
        });
        // Convert total minutes to milliseconds and humanize
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Calculate the total number of lectures across all chapters in a course
    const calculateNoOfLectures = (course) => {
        let totalLectures = 0;
        course.courseContent.forEach((section) => {
            if (Array.isArray(section.chapterContent)) {
                totalLectures += section.chapterContent.length;
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
            if (!isNetworkError(error)) {
                toast.error(getApiErrorMessage(error, 'Failed to load enrolled courses'));
            }
        }
    };

    // Fetch detailed profile data for the logged-in user from the backend
    const fetchUserData = async () => {
        try {
            setUserDataLoading(true);
            const token = await getToken();
            const { data } = await axios.get(backendUrl + '/api/user/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (data.success && data.user) {
                setUserData(data.user);
                // Set the educator status based on the user's role
                setIsEducator(data.user.role === 'educator');
            } else {
                if (data.success && !data.user) {
                    console.log("User found in Clerk but not in DB yet");
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setUserDataLoading(false);
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
            toast.error(getApiErrorMessage(error, 'Failed to become an educator'));
        }
    };

    // Initial load: Fetch all courses regardless of login status
    useEffect(() => {
        fetchAllCourses();
    }, []);


    // React to user login: Fetch user-specific data when the Clerk user is available
    useEffect(() => {
        if (!isLoaded) {
            return;
        }

        if (!user) {
            setUserData(null);
            setIsEducator(false);
            setUserDataLoading(false);
            return;
        }

        fetchUserData();
        fetchEnrolledCourses();
    }, [user, isLoaded]);

    // Provide all state and functions to the rest of the application
    const value = {
        currency,
        backendUrl,
        allCourses,
        setAllCourses,
        navigate,
        calculateRating,
        calculateSectionTime,
        calculateCourseDuration,
        calculateNoOfLectures,
        isEducator,
        setIsEducator,
        enrolledCourses,
        setEnrolledCourses,
        userData,
        setUserData,
        userDataLoading,
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
