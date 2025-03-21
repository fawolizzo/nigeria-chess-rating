
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the root element
const rootElement = document.getElementById('root')

if (!rootElement) {
  console.error('Failed to find the root element with id "root"')
  document.body.innerHTML = '<div style="padding: 20px; font-family: sans-serif;"><h2>Error: Root element not found</h2><p>The application could not initialize because the root element was not found.</p></div>'
} else {
  try {
    // Render directly to DOM first to verify DOM rendering works
    rootElement.innerHTML = '<div id="loading-indicator" style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif;">Loading Nigerian Chess Rating System...</div>'
    
    // Now attempt to mount React
    const root = createRoot(rootElement)
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
    console.log('App successfully mounted to DOM')
  } catch (error) {
    console.error('Critical error rendering the application:', error)
    rootElement.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center;">
        <h1>Something went wrong</h1>
        <p>The application failed to load. Technical details:</p>
        <pre style="background: #f4f4f4; padding: 10px; text-align: left; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
      </div>
    `
  }
}
