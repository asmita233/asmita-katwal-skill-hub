import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/student/Home'
import CoursesList from './pages/student/CoursesList'
import CourseDetails from './pages/student/CourseDetails'
import MyEnrollment from './pages/student/MyEnrollment'
import Player from './pages/student/Player'
import Educator from './pages/educator/Educator'
import Dashboard from './pages/educator/Dashboard'
import AddCourses from './pages/educator/AddCourses'
import MyCourses from './pages/educator/MyCourses'
import Navbar from './components/students/Navbar'

const App = () => {
  return (
    <div className='text-default min-h-screen bg-white'>

     
      <Navbar />
      <Routes>
     <Route path='/' element={<Home/>}/>
     <Route path='/course-list' element={<CoursesList/>}/>

     <Route path='/course/:id' element={< CourseDetails/>}/>
      <Route path='/my-enrollments' element={<MyEnrollment/>}/>
      <Route path='/player/:courseId' element={<Player/>}/>
      {/* <Route path='/loading/:path' element={<CoursesList/>}/> */}
      <Route path='/course-list' element={<CoursesList/>}/>
       
{/* neated route lako xa */}
            
       <Route path='/educator' element={< Educator/>}>
            <Route path='educator' element={< Dashboard/>}/>
            <Route path='add-course' element={<  AddCourses/>}/>
             <Route path='my-courses' element={< MyCourses/>}/>

       </Route>
      </Routes>
    </div>
  )
}

export default App
