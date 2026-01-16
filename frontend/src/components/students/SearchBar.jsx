import React, { useState } from 'react'
import { assets } from '../../assets/assets'
import { useNavigate } from 'react-router-dom'

const SearchBar = ({ data }) => {
  const navigate = useNavigate()
  const [input, setInput] = useState(data || '')

  const onSearchHandler = (e) => {
    e.preventDefault()
    if (!input.trim()) {
      navigate('/course-list')
      return
    }
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
      <img
        src={assets.search_icon}
        alt="search"
        className="w-10 px-3"
      />

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
