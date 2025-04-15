
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add global declarations for debugging and monitoring functions
// These types match what's defined in the vite-env.d.ts file
declare global {
  interface Window {
    ncrRunDiagnostics: () => Record<string, any>;
    ncrForceSyncFunction: (keys?: string[]) => Promise<boolean>;
    ncrClearAllData: () => Promise<boolean>;
    ncrIsResetting: boolean;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
