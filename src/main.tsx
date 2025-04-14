
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { detectPlatform } from '@/utils/storageSync';

try {
  // Ensure that the container element exists before rendering
  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Failed to find the root element. Make sure there is a div with id 'root' in your HTML.");
  }

  // Detect platform and log it early
  const platform = detectPlatform();
  const isProduction = import.meta.env.PROD;
  
  // Only log detailed platform info in development
  if (!isProduction) {
    logMessage(LogLevel.INFO, 'Main', `Starting application on ${platform.type} platform (${platform.details || 'generic'})`);
  } else {
    logMessage(LogLevel.INFO, 'Main', `Starting application in production mode`);
  }
  
  const root = createRoot(container);
  root.render(<App />);
  
  if (!isProduction) {
    logMessage(LogLevel.INFO, 'Main', `Application rendered successfully on ${platform.type} platform`);
    
    // Add global debugging function for cross-platform testing (only in development)
    window.ncrRunDiagnostics = () => {
      const platform = detectPlatform();
      const { runStorageDiagnostics } = require('./utils/storageSync');
      const { checkCrossPlatformCompatibility } = require('./utils/storageUtils');
      
      const results = {
        platform,
        storage: runStorageDiagnostics(),
        compatibility: checkCrossPlatformCompatibility(),
        timestamp: new Date().toISOString()
      };
      
      console.log('[NCR Diagnostics]', results);
      return results;
    };
  } else {
    // In production, don't expose diagnostic functions
    window.ncrRunDiagnostics = () => {
      return { disabled: true, message: 'Diagnostics disabled in production mode' };
    };
  }
} catch (error) {
  console.error("Critical error during application initialization:", error);
  
  // Display a basic error message directly in the DOM if possible
  const errorContainer = document.getElementById("root") || document.body;
  
  if (errorContainer) {
    errorContainer.innerHTML = `
      <div style="font-family: sans-serif; padding: 20px; text-align: center; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #d32f2f;">Something went wrong</h1>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: left;">
          <pre style="white-space: pre-wrap; overflow-wrap: break-word;">${error instanceof Error ? error.message : 'Unknown error'}</pre>
        </div>
        <p>Try refreshing the page or contact support if the problem persists.</p>
        <button 
          style="background-color: #4caf50; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 10px;"
          onclick="window.location.reload()"
        >
          Refresh Page
        </button>
      </div>
    `;
  }
}
