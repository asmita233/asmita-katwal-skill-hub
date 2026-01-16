import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Home from './pages/student/Home'
import CoursesList from './pages/student/CoursesList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollment from './pages/student/MyEnrollment'
import Player from './pages/student/Player'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourses from './pages/educator/AddCourses'
import MyCourses from './pages/educator/MyCourses'
import StudentEnrollment from './pages/educator/StudentEnrollment'
import Navbar from './components/students/Navbar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const App = () => {
  const location = useLocation();

  // Hide navbar on educator routes and player page
  const hideNavbar = location.pathname.startsWith('/educator') ||
    location.pathname.startsWith('/player');

  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />
      {!hideNavbar && <Navbar />}
      <Routes>
        {/* Student Routes */}
        <Route path='/' element={<Home />} />
        <Route path='/course-list' element={<CoursesList />} />
        <Route path='/course-list/:input' element={<CoursesList />} />
        <Route path='/course/:id' element={<CourseDetails />} />
        <Route path='/my-enrollments' element={<MyEnrollment />} />
        <Route path='/player/:courseId' element={<Player />} />

        {/* Educator Routes - Nested */}
        <Route path='/educator' element={<Educator />}>
          <Route index element={<Dashboard />} />
          <Route path='add-course' element={<AddCourses />} />
          <Route path='my-courses' element={<MyCourses />} />
          <Route path='student-enrolled' element={<StudentEnrollment />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App
