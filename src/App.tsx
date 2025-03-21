
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';

// Import pages
import Index from './pages/Index';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import OrganizerDashboard from './pages/OrganizerDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import TournamentManagement from './pages/TournamentManagement';
import Tournaments from './pages/Tournaments';
import TournamentDetails from './pages/TournamentDetails';
import Players from './pages/Players';
import PlayerProfile from './pages/PlayerProfile';
import NotFound from './pages/NotFound';

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

// Higher-order component for protected routes
const RequireAuth = ({ children, role }: { children: React.ReactNode; role: string }) => {
  const userJSON = localStorage.getItem('ncr_current_user');
  
  if (!userJSON) {
    console.log('Auth check failed: No user found in localStorage');
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userJSON);
    if (user.role !== role) {
      console.log(`Auth check failed: User role ${user.role} doesn't match required role ${role}`);
      return <Navigate to="/" replace />;
    }
    console.log('Auth check passed for role:', role);
    return children;
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem('ncr_current_user');
    return <Navigate to="/login" replace />;
  }
};

// App component with DEBUG rendering
function App() {
  console.log("App component rendering");
  
  // Add a simple loading state to see if the component mounts
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    console.log("App component mounted");
    // Set loading to false after a short delay to ensure all resources are loaded
    const timer = setTimeout(() => setIsLoading(false), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Show a simple loading state for debugging
  if (isLoading) {
    return <div className="p-8 text-center">Loading application...</div>;
  }

  return (
    <ErrorBoundary>
      <UserProvider>
        <Router>
          {/* Add a debug element to ensure the app is rendering */}
          <div id="app-debug" style={{ display: 'none' }}>App initialized</div>
          
          <div className="app-container bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected organizer routes */}
              <Route path="/organizer/dashboard" element={
                <RequireAuth role="tournament_organizer">
                  <OrganizerDashboard />
                </RequireAuth>
              } />
              
              <Route path="/tournament/:id/manage" element={
                <RequireAuth role="tournament_organizer">
                  <TournamentManagement />
                </RequireAuth>
              } />
              
              {/* Protected officer routes */}
              <Route path="/officer/dashboard" element={
                <RequireAuth role="rating_officer">
                  <OfficerDashboard />
                </RequireAuth>
              } />
              
              {/* Public routes */}
              <Route path="/tournament/:id" element={<TournamentDetails />} />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/players" element={<Players />} />
              <Route path="/player/:id" element={<PlayerProfile />} />
              
              {/* Redirects for incorrect URLs */}
              <Route path="/organizer-dashboard" element={<Navigate to="/organizer/dashboard" replace />} />
              <Route path="/officer-dashboard" element={<Navigate to="/officer/dashboard" replace />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
