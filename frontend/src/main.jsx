// Importing the necessary modules for React and routing
import { createRoot } from 'react-dom/client'
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

// Rendering the main App within the necessary providers:
// 1. ClerkProvider for authentication management
// 2. BrowserRouter for handling client-side routing
// 3. AppContextProvider for shared global application state
createRoot(document.getElementById('root')).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <BrowserRouter>
      <AppContextProvider>
        <App />
      </AppContextProvider>
    </BrowserRouter>
  </ClerkProvider>
)
