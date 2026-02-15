import React, { useState } from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

/**
 * SearchBar Component: Handles user input for finding courses.
 * Logic:
 * - Uses local state 'input' to track typing.
 * - On submission, it pushes the query to the URL via '/course-list/:query'.
 * - This allows users to share direct links to search results.
 */
const SearchBar = ({ data }) => {
  const navigate = useNavigate()

  // Local state initialized with optional default data (usually from URL params)
  const [input, setInput] = useState(data || '')

  /**
   * Search Submission Handler:
   * 1. Prevents page reload.
   * 2. If input is empty, redirects to the base courses list.
   * 3. If input exists, redirects to the dynamic search route.
   */
  const onSearchHandler = (e) => {
    e.preventDefault()
    if (!input.trim()) {
      navigate('/course-list')
      return
    }
    // Encodes the search term in the URL for the CoursesSection/CoursesList to consume
    navigate('/course-list/' + input)
  }

  return (
    <form
      onSubmit={onSearchHandler}
      className="
        max-w-xl w-full h-12 md:h-14
        flex items-center
        bg-white border border-gray-300
        rounded-md shadow-sm
      "
    >
      {/* Visual Search Icon */}
      <img
        src={assets.search_icon}
        alt="search"
        className="w-10 px-3"
      />

      {/* Controlled Input Field */}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search for courses"
        className="
          w-full h-full outline-none
          text-gray-600
        "
      />

      {/* Submission Button */}
      <button
        type="submit"
        className="
          bg-blue-600 text-white
          px-6 md:px-10 py-2
          rounded-md mr-1
          hover:bg-blue-700 transition
        "
      >
        Search
      </button>
    </form>
  )
}

export default SearchBar

