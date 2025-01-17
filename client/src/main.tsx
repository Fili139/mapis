import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId="798217786977-0egsto7cdcdv63l2vjqd226kdg572fq6.apps.googleusercontent.com">
    <StrictMode>
      <App />
    </StrictMode>
  </GoogleOAuthProvider>
)
