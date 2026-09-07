import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import React from "react"
import { GoogleOAuthProvider } from '@react-oauth/google'

const client_id = "830347299700-s47i9sicfvfh7ph3b5q9kunbk02dhldm.apps.googleusercontent.com"
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={client_id}>
    <App />
    </GoogleOAuthProvider>
  </StrictMode>,
)
