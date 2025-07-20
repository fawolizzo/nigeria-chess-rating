import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { UserProvider } from './contexts/UserContext';
import { ThemeProvider } from './components/theme-provider';
import { Toaster } from './components/ui/toaster';

// Initialize test data in development
if (import.meta.env.DEV) {
  import('./utils/initializeTestData').then(({ initializeTestData }) => {
    initializeTestData();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <UserProvider>
        <App />
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);
