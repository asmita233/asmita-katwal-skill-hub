import React, { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';
import CourseCard from './CourseCard';

/**
 * CoursesSection Component: Renders a preview grid of featured courses on the landing page.
 * Logic:
 * - Fetches 'allCourses' from the global context.
 * - Slices the array to only show the first 4 items (Featured preview).
 * - Provides a "Show all" link to redirect to the full catalog.
 */
const CoursesSection = () => {
  const { allCourses } = useContext(AppContext);

  return (
    <div className="py-16 md:px-40 px-8">
      {/* --- Section Branding --- */}
      <h2 className="text-3xl font-medium text-gray-800">
        Learn from the best
      </h2>

      <p className="text-sm md:text-base text-gray-500 mt-3">
        Discover our top-rated courses across various categories. From coding
        and design to <br /> business and wellness, our courses are crafted to
        deliver results.
      </p>

      {/* --- Responsive Grid: Displays 1 to 4 cards depending on screen size --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 px-4 md:px-0 md:my-16 my-10 gap-6">
        {/* Mapping the first 4 courses to CourseCard components */}
        {allCourses?.slice(0, 4).map((course, index) => (
          <CourseCard key={course._id || index} course={course} />
        ))}
      </div>

      {/* --- CTA to Full Catalog --- */}
      <Link
        to="/course-list"
        onClick={() => window.scrollTo(0, 0)} // Reset scroll to top upon navigation
        className="inline-block mt-6 text-gray-500 border border-gray-500/30 px-10 py-3 rounded hover:bg-gray-50 transition"
      >
        Show all courses
      </Link>
    </div>
  );
};

export default CoursesSection;

