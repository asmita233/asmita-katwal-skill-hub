import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { AppContext } from '../context/AppContext'

const ProtectedEducatorRoute = ({ children }) => {
  const { user } = useUser()
  const { userData, userDataLoading } = useContext(AppContext)

  if (!user) {
    return <Navigate to='/' replace />
  }

  if (userDataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="h-12 w-12 rounded-full border-4 border-purple-100 border-t-purple-600 animate-spin" />
      </div>
    )
  }

  if (userData?.role !== 'educator') {
    return <Navigate to='/' replace />
  }

  return children
}

export default ProtectedEducatorRoute
