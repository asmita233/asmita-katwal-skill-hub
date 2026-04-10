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
  const { navigate, becomeEducator, userData } = React.useContext(AppContext);

  // Effect hook to check if the user intended to go to a specific dashboard 
  // before being redirected to Home (e.g., after logging in)
  React.useEffect(() => {
    const preferredRole = sessionStorage.getItem('preferredRole');
    
    if (preferredRole === 'educator') {
      sessionStorage.removeItem('preferredRole');
      // If user is already logged in but not an educator, trigger the becomeEducator switch
      if (userData && userData.role !== 'educator') {
        becomeEducator();
      } else {
        navigate('/educator');
      }
    } else if (preferredRole === 'student') {
      sessionStorage.removeItem('preferredRole');
      navigate('/dashboard');
    }
  }, [navigate, becomeEducator, userData]);

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
