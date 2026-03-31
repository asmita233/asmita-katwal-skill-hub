import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import CourseCard from '../../components/students/CourseCard';
import SearchBar from '../../components/students/SearchBar';
import { assets } from '../../assets/assets';
import Footer from '../../components/students/Footer';

const CourseList = () => {
  const navigate = useNavigate();
  const { allCourses, loading, calculateRating } = useContext(AppContext);
  const { input } = useParams();
  const [filteredCourses, setFilteredCourses] = useState([]);

  // Filter states
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // Extract unique categories from all courses
  const categories = ['all', ...new Set(allCourses?.map(c => c.category).filter(Boolean))];
  const levels = ['all', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'];

  // Effect to handle filtering and sorting
  useEffect(() => {
    if (allCourses && allCourses.length > 0) {
      let tempCourses = allCourses.slice();

      // Text search filter
      if (input) {
        tempCourses = tempCourses.filter((item) =>
          (item.courseTitle || '').toLowerCase().includes(input.toLowerCase()) ||
          (item.courseDescription || '').toLowerCase().includes(input.toLowerCase()) ||
          (item.category || '').toLowerCase().includes(input.toLowerCase())
        );
      }

      // Category filter
      if (categoryFilter !== 'all') {
        tempCourses = tempCourses.filter(c => c.category === categoryFilter);
      }

      // Level filter
      if (levelFilter !== 'all') {
        tempCourses = tempCourses.filter(c => c.level === levelFilter);
      }

      // Price filter
      if (priceFilter === 'free') {
        tempCourses = tempCourses.filter(c => {
          const discountedPrice = c.coursePrice - (c.discount * c.coursePrice) / 100;
          return discountedPrice === 0;
        });
      } else if (priceFilter === 'paid') {
        tempCourses = tempCourses.filter(c => {
          const discountedPrice = c.coursePrice - (c.discount * c.coursePrice) / 100;
          return discountedPrice > 0;
        });
      }

      // Sorting
      switch (sortBy) {
        case 'newest':
          tempCourses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          tempCourses.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'price-low':
          tempCourses.sort((a, b) => {
            const priceA = a.coursePrice - (a.discount * a.coursePrice) / 100;
            const priceB = b.coursePrice - (b.discount * b.coursePrice) / 100;
            return priceA - priceB;
          });
          break;
        case 'price-high':
          tempCourses.sort((a, b) => {
            const priceA = a.coursePrice - (a.discount * a.coursePrice) / 100;
            const priceB = b.coursePrice - (b.discount * b.coursePrice) / 100;
            return priceB - priceA;
          });
          break;
        case 'popular':
          tempCourses.sort((a, b) => (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0));
          break;
        case 'rated':
          tempCourses.sort((a, b) => calculateRating(b) - calculateRating(a));
          break;
        default:
          break;
      }

      setFilteredCourses(tempCourses);
    }
  }, [allCourses, input, categoryFilter, levelFilter, priceFilter, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('all');
    setLevelFilter('all');
    setPriceFilter('all');
    setSortBy('newest');
    if (input) navigate('/course-list');
  };

  const hasActiveFilters = categoryFilter !== 'all' || levelFilter !== 'all' || priceFilter !== 'all' || sortBy !== 'newest' || input;

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
        {/* Header Section */}
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

          <div className="flex items-center gap-3">
            <SearchBar data={input} />
            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${showFilters
                  ? 'bg-blue-50 border-blue-200 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-slideUp">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider">Filter & Sort</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'all' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Level Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Level</label>
                <select
                  value={levelFilter}
                  onChange={(e) => setLevelFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  {levels.map(level => (
                    <option key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Price</label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  <option value="all">All Prices</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="popular">Most Popular</option>
                  <option value="rated">Highest Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filter Tags */}
        <div className="flex flex-wrap gap-2 mt-6">
          {input && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-blue-200 rounded-full text-blue-700 bg-blue-50 text-sm">
              <span>Search: {input}</span>
              <img
                src={assets.cross_icon}
                alt="clear"
                className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                onClick={() => navigate('/course-list')}
              />
            </div>
          )}
          {categoryFilter !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-green-200 rounded-full text-green-700 bg-green-50 text-sm">
              <span>Category: {categoryFilter}</span>
              <button onClick={() => setCategoryFilter('all')} className="text-green-400 hover:text-green-600">✕</button>
            </div>
          )}
          {levelFilter !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-purple-200 rounded-full text-purple-700 bg-purple-50 text-sm">
              <span>Level: {levelFilter}</span>
              <button onClick={() => setLevelFilter('all')} className="text-purple-400 hover:text-purple-600">✕</button>
            </div>
          )}
          {priceFilter !== 'all' && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-amber-200 rounded-full text-amber-700 bg-amber-50 text-sm">
              <span>{priceFilter === 'free' ? 'Free Courses' : 'Paid Courses'}</span>
              <button onClick={() => setPriceFilter('all')} className="text-amber-400 hover:text-amber-600">✕</button>
            </div>
          )}
        </div>

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

        {/* UI for when no courses match */}
        {filteredCourses.length === 0 && (
          <div className="text-center py-20">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-medium text-gray-800 mb-2">
              No courses found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your search or filters
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default CourseList;
