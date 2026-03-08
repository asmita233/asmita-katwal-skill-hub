import React from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
// Importing student pages
import Home from './pages/student/Home'
import Landing from './pages/student/Landing'
import CoursesList from './pages/student/CoursesList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollment from './pages/student/MyEnrollment'
import Player from './pages/student/Player'
import PaymentSuccess from './pages/student/PaymentSuccess'
import Wishlist from './pages/student/Wishlist'
import StudentDashboard from './pages/student/StudentDashboard'
import Certificates from './pages/student/Certificates'
import Profile from './pages/student/Profile'
// Importing educator pages
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourses from './pages/educator/AddCourses'
import MyCourses from './pages/educator/MyCourses'
import StudentEnrollment from './pages/educator/StudentEnrollment'
import EducatorQA from './pages/educator/EducatorQA'
import EducatorReviews from './pages/educator/EducatorReviews'
// Importing global components and toast notifications
import Navbar from './components/students/Navbar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUser } from '@clerk/clerk-react'

const App = () => {
  // Hook to get the current location for conditional rendering
  const location = useLocation();
  // Hook to get current user data and loading status from Clerk
  const { user, isLoaded } = useUser();

  // Logic to determine if the navbar should be hidden based on the current route
  // We hide it on the main landing page (for guests), educator routes, and the course player
  const isLandingPage = location.pathname === '/' && !user;
  const hideNavbar = isLandingPage ||
    location.pathname.startsWith('/educator') ||
    location.pathname.startsWith('/player');

  // State to track if loading is taking too long
  const [showError, setShowError] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) setShowError(true);
    }, 10000); // 10 seconds timeout
    return () => clearTimeout(timer);
  }, [isLoaded]);

  // Prevent rendering anything until Clerk has finished loading user status
  if (!isLoaded) return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50'>
      {!showError ? (
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      ) : (
        <div className='text-center p-6 bg-white shadow-lg rounded-lg border border-red-100 max-w-sm'>
          <h2 className='text-xl font-bold text-red-600 mb-2'>Connection Error</h2>
          <p className='text-gray-600 mb-4'>We couldn't connect to the authentication service. Please check your internet connection.</p>
          <button
            onClick={() => window.location.reload()}
            className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
          >
            Retry Now
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className='text-default min-h-screen bg-white'>
      {/* Container for display-wide toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {/* Conditionally render the student navbar */}
      {!hideNavbar && <Navbar />}

      {/* Main application routing structure */}
      <Routes>
        {/* Home route: shows Home if logged in, otherwise Landing page */}
        <Route path='/' element={user ? <Home /> : <Landing />} />

        {/* Public/Student-accessible routes for course browsing */}
        <Route path='/course-list' element={<CoursesList />} />
        <Route path='/course-list/:input' element={<CoursesList />} />
        <Route path='/course/:id' element={<CourseDetails />} />

        {/* Protected routes: redirect and require the user to be logged in */}
        <Route path='/my-enrollments' element={user ? <MyEnrollment /> : <Navigate to="/" />} />
        <Route path='/player/:courseId' element={user ? <Player /> : <Navigate to="/" />} />
        <Route path='/payment-success' element={user ? <PaymentSuccess /> : <Navigate to="/" />} />
        <Route path='/wishlist' element={user ? <Wishlist /> : <Navigate to="/" />} />
        <Route path='/dashboard' element={user ? <StudentDashboard /> : <Navigate to="/" />} />
        <Route path='/certificates' element={user ? <Certificates /> : <Navigate to="/" />} />
        <Route path='/profile' element={user ? <Profile /> : <Navigate to="/" />} />

        {/* Educator-specific routes wrapped in the Educator layout component */}
        <Route path='/educator' element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path='add-course' element={<AddCourses />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='student-enrolled' element={<StudentEnrollment />} />
          <Route path='questions' element={<EducatorQA />} />
          <Route path='reviews' element={<EducatorReviews />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
