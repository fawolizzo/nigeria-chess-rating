
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ensure we have proper error handling for the root element
const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

// Add error boundary to catch any rendering errors
const renderApp = () => {
  try {
    createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('App successfully rendered')
  } catch (error) {
    console.error('Failed to render the app:', error)
    // Display a fallback error message on the page
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>Something went wrong</h1>
        <p>The application failed to load. Please check the console for more details.</p>
      </div>
    `
  }
}

renderApp()
