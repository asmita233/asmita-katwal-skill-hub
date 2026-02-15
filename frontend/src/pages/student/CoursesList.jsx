import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import CourseCard from '../../components/students/CourseCard';
import SearchBar from '../../components/students/SearchBar';
import { assets } from '../../assets/assets';
import Footer from '../../components/students/Footer';

const CourseList = () => {
  // Navigation hook to change programmatically between routes
  const navigate = useNavigate();
  // Get all courses data and application loading state from global context
  const { allCourses, loading } = useContext(AppContext);
  // Extract user search input from the URL parameters
  const { input } = useParams();
  // Local state to store courses that match the current search filter
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Effect to handle filtering courses whenever the data source or search input changes
  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      const tempCourses = allCourses.slice();

      // If a search term exists in the URL, filter the list by courseTitle
      if (input) {
        setFilteredCourses(
          tempCourses.filter((item) =>
            item.courseTitle.toLowerCase().includes(input.toLowerCase())
          )
        );
      } else {
        // If no input, show the full list of courses
        setFilteredCourses(tempCourses);
      }
    }
  }, [allCourses, input]);

  // Render a full-screen loading spinner while the context is fetching data
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="relative md:px-36 px-8 pt-20 pb-10 text-left min-h-screen">
        {/* Header Section including dynamic breadcrumbs and Search Bar */}
        <div className="flex flex-col md:flex-row gap-6 items-start justify-between w-full">
          <div>
            <h1 className="text-4xl font-semibold text-gray-800">Course List</h1>
            <p className="text-gray-500 mt-2">
              <span
                className="text-blue-600 cursor-pointer hover:underline"
                onClick={() => navigate('/')}
              >
                Home
              </span>{' '}
              / <span>Course List</span>
            </p>
          </div>

          <SearchBar data={input} />
        </div>

        {/* Display a "tag" if the list is being filtered by a search term */}
        {input && (
          <div className="inline-flex items-center gap-4 px-4 py-2 border border-gray-200 rounded-full mt-8 mb-4 text-gray-600 bg-white">
            <p>{input}</p>
            {/* Click cross icon to clear the search filter and go back to full list */}
            <img
              src={assets.cross_icon}
              alt="clear"
              className="h-4 w-4 cursor-pointer opacity-60 hover:opacity-100"
              onClick={() => navigate('/course-list')}
            />
          </div>
        )}

        {/* Results Counter */}
        <p className="text-gray-500 mt-4">
          Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
        </p>

        {/* Responsive Grid Layout for Course Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-8">
          {filteredCourses.map((course, index) => (
            <CourseCard key={course._id || index} course={course} />
          ))}
        </div>

        {/* UI for when no courses match the search criteria */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <img
              src={assets.search_icon}
              alt="No courses"
              className="w-16 h-16 mx-auto opacity-30 mb-4"
            />
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search terms
            </p>
          </div>
        )}

        {/* Load More Button (UI logic for pagination placeholder) */}
        {filteredCourses.length > 0 && filteredCourses.length >= 8 && (
          <div className="text-center mt-12">
            <button className="px-8 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition">
              Load More
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default CourseList;
