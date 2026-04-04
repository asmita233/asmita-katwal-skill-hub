// Importing the necessary modules for React and routing
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AppContextProvider } from './context/AppContext.jsx'
import { ClerkProvider } from '@clerk/clerk-react'

// Fetching the Clerk Publishable Key from environment variables for authentication
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

// Error handling to ensure the Clerk key is present before continuing
if (!PUBLISHABLE_KEY) {
  throw new Error('Missing Publishable Key')
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
      error.message = 'Backend server is unreachable. Start the server and try again.'
    }

    return Promise.reject(error)
  }
)


createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </ClerkProvider>
)
