import React, { useContext } from 'react';
import { UserButton, useUser } from '@clerk/clerk-react';
import { assets } from '../../assets/assets';
import { AppContext } from '../../context/AppContext';

const Navbar = () => {
  const { user } = useUser();
  const { navigate } = useContext(AppContext);

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
      {/* Left side - can be used for breadcrumbs or page title */}
      <div className="flex items-center gap-4">
        {/* Placeholder for mobile menu button */}
      </div>

      {/* Right side - User info */}
      <div className="flex items-center gap-4">
        {user && (
          <>
            <span className="text-sm text-gray-600 hidden md:block">
              Hi, {user.firstName || 'Educator'}
            </span>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
