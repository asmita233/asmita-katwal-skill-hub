import React from 'react'
import Hero from '../../components/students/Hero'
import Companies from '../../components/students/Companies'
import PathSection from '../../components/students/PathSection'
import CoursesSection from '../../components/students/CoursesSection'
import TestimonialSection from '../../components/students/TestimonialSection'
import CallToAction from '../../components/students/CallToAction'
import Footer from '../../components/students/Footer'
import { AppContext } from '../../context/AppContext'

const Home = () => {
  // Use context for navigation
  const { navigate, becomeEducator, userData, isEducator, userDataLoading } = React.useContext(AppContext);

  // Effect hook to check if the user intended to go to a specific dashboard 
  // before being redirected to Home (e.g., after logging in)
  React.useEffect(() => {
    // Wait for user data to load before making routing decisions
    if (userDataLoading) return;

    const preferredRole = sessionStorage.getItem('preferredRole');
    
    // 1. Handle Critical Role Commitment (only triggered by explicit modal selection)
    if (preferredRole === 'educator') {
      sessionStorage.removeItem('preferredRole');
      if (userData && userData.role !== 'educator') {
        becomeEducator();
      } else {
        navigate('/educator');
      }
      return;
    } else if (preferredRole === 'student') {
      sessionStorage.removeItem('preferredRole');
      // If they are already a teacher, they get redirected from dashboard anyway, 
      // but let's send them there to see the "locked" message logic
      navigate('/dashboard');
      return;
    }

    // Note: We removed the aggressive redirect from Home.jsx to allow 
    // Educators to see the landing page, but Dashboards remain locked.
  }, [navigate, becomeEducator, userData, isEducator, userDataLoading]);

  return (
    <div className='flex flex-col items-center space-y-7 text-center'>
      {/* Page sections providing a full marketing lifecycle for students */}
      <Hero />
      <Companies />
      <PathSection />
      <CoursesSection />
      <TestimonialSection />
      <CallToAction />
      <Footer />
    </div>
  )
}

export default Home
