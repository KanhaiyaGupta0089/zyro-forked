import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { store } from './redux/store'
import './index.css'
import App from './App.tsx'

// Get Google Client ID from environment variables
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

// Check if Google Client ID is provided
if (!GOOGLE_CLIENT_ID) {
  console.warn(
    '⚠️ VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work. ' +
    'Please add VITE_GOOGLE_CLIENT_ID to your .env file.'
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {GOOGLE_CLIENT_ID ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Provider store={store}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </Provider>
      </GoogleOAuthProvider>
    ) : (
      <Provider store={store}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Provider>
    )}
  </StrictMode>,
)
