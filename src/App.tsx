
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import MinimalTest from './pages/MinimalTest';

// Define types for the ErrorBoundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Simple error boundary component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-lg">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
            <p className="mb-4">The application encountered an error. Please try again later.</p>
            <pre className="bg-gray-100 p-4 rounded text-left text-sm overflow-auto mb-4">
              {this.state.error?.toString() || 'Unknown error'}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// App component with simplified routing for debugging
function App() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Mark component as mounted to confirm React lifecycle is working
    setMounted(true);
    console.log("App component mounted successfully");
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-debug-container" style={{ padding: '20px', fontFamily: 'sans-serif' }}>
        {/* Debug info that will show up if React is working but routing isn't */}
        {mounted && (
          <div id="react-works" style={{ position: 'fixed', top: 0, right: 0, background: '#eee', padding: '5px', zIndex: 9999, fontSize: '12px' }}>
            React mounted ✓
          </div>
        )}
        
        <UserProvider>
          <Router>
            <Routes>
              {/* Add a test route first to verify routing */}
              <Route path="/test" element={<MinimalTest />} />
              
              {/* Original routes */}
              <Route path="/" element={<Navigate to="/test" replace />} />
              {/* We'll add back the other routes after confirming basic functionality */}
            </Routes>
            <Toaster />
          </Router>
        </UserProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
