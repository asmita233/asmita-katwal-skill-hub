import React from 'react'
import { Route, Routes, useLocation, Navigate } from 'react-router-dom'
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
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourses from './pages/educator/AddCourses'
import MyCourses from './pages/educator/MyCourses'
import StudentEnrollment from './pages/educator/StudentEnrollment'
import EditCourse from './pages/educator/EditCourse'
import EducatorQA from './pages/educator/EducatorQA'
import EducatorReviews from './pages/educator/EducatorReviews'
import Navbar from './components/students/Navbar'
// ProtectedEducatorRoute removed — Educator.jsx handles its own role gating
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useUser } from '@clerk/clerk-react'

const App = () => {
  const location = useLocation()
  const { user, isLoaded } = useUser()

  const isLandingPage = location.pathname === '/' && !user
  const hideNavbar =
    isLandingPage ||
    location.pathname.startsWith('/educator') ||
    location.pathname.startsWith('/player')

  const [showError, setShowError] = React.useState(false)

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (!isLoaded) setShowError(true)
    }, 10000)

    return () => clearTimeout(timer)
  }, [isLoaded])

  if (!isLoaded)
    return (
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
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path='/' element={user ? <Home /> : <Landing />} />

        <Route path='/course-list' element={<CoursesList />} />
        <Route path='/course-list/:input' element={<CoursesList />} />
        <Route path='/course/:id' element={<CourseDetails />} />

        <Route path='/my-enrollments' element={user ? <MyEnrollment /> : <Navigate to="/" />} />
        <Route path='/player/:courseId' element={user ? <Player /> : <Navigate to="/" />} />
        <Route path='/payment-success' element={user ? <PaymentSuccess /> : <Navigate to="/" />} />
        <Route path='/wishlist' element={user ? <Wishlist /> : <Navigate to="/" />} />
        <Route path='/dashboard' element={user ? <StudentDashboard /> : <Navigate to="/" />} />
        <Route path='/certificates' element={user ? <Certificates /> : <Navigate to="/" />} />
        <Route path='/profile' element={user ? <Profile /> : <Navigate to="/" />} />

        <Route path='/educator' element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path='add-course' element={<AddCourses />} />
          <Route path='edit-course/:id' element={<EditCourse />} />
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
