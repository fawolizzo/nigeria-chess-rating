
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import MinimalTest from './pages/MinimalTest';
import NotFound from './pages/NotFound';
import Login from './pages/Login';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import OfficerDashboard from './pages/OfficerDashboard';
import Index from './pages/Index';
import About from './pages/About';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import OrganizerDashboard from './pages/OrganizerDashboard';
import TournamentManagement from './pages/TournamentManagement';
import Register from './pages/Register';

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

// RequireAuth component to handle authentication checks
interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children, allowedRoles = [] }) => {
  const location = useLocation();
  // For now, we'll keep authentication checks simple
  // This will be expanded when we implement authentication fully
  const isAuthenticated = true; // Replace with actual auth check
  const userRole = 'user'; // Replace with actual role check

  if (!isAuthenticated) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to unauthorized page if not authorized
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// App component with full routing
function App() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Mark component as mounted to confirm React lifecycle is working
    setMounted(true);
    console.log("App component mounted successfully");
  }, []);

  return (
    <ErrorBoundary>
      <div className="app-container min-h-screen">
        {/* Debug info that will show up if React is working but routing isn't */}
        {mounted && (
          <div id="react-works" style={{ position: 'fixed', top: 0, right: 0, background: '#eee', padding: '5px', zIndex: 9999, fontSize: '12px' }}>
            React mounted ✓
          </div>
        )}
        
        <UserProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/players" element={<Players />} />
              <Route path="/player/:id" element={<PlayerProfile />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournament/:id" element={<TournamentDetails />} />
              
              {/* Protected Routes */}
              <Route path="/organizer/dashboard" element={
                <RequireAuth allowedRoles={['tournament_organizer', 'rating_officer']}>
                  <OrganizerDashboard />
                </RequireAuth>
              } />
              <Route path="/tournament-management/:id" element={
                <RequireAuth allowedRoles={['tournament_organizer', 'rating_officer']}>
                  <TournamentManagement />
                </RequireAuth>
              } />
              <Route path="/officer/dashboard" element={
                <RequireAuth allowedRoles={['rating_officer']}>
                  <OfficerDashboard />
                </RequireAuth>
              } />
              
              {/* Test Route (we'll keep it for debugging) */}
              <Route path="/test" element={<MinimalTest />} />
              
              {/* 404 Route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </Router>
        </UserProvider>
      </div>
    </ErrorBoundary>
  );
}

export default App;
