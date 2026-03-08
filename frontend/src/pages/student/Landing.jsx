import React, { useContext } from 'react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { useClerk } from '@clerk/clerk-react';
import Hero from '../../components/students/Hero';
import Companies from '../../components/students/Companies';
import PathSection from '../../components/students/PathSection';
import Footer from '../../components/students/Footer';

const Landing = () => {
    const { navigate } = useContext(AppContext);
    const { openSignUp, openSignIn } = useClerk();

    return (
        <div className="min-h-screen bg-white flex flex-col relative overflow-hidden">
            {/* Background Orbs for Premium Look */}
            <div className="absolute top-[-5%] left-[-5%] w-[30%] h-[30%] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Design 1 Section: Hero + Search */}
            <Hero />

            {/* Trust Section */}
            <Companies />

            {/* Design 2 Section: Path Selection (Using reusable component) */}
            <PathSection />

            <Footer />
        </div>
    );
};

export default Landing;
