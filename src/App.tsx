
import React, { useEffect, ErrorInfo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';

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

// Error boundary component to catch rendering errors
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="text-center max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-4 text-red-600">Something went wrong</h1>
            <p className="mb-4">The application encountered an error. Please try refreshing the page.</p>
            <button 
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = '/';
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for protected routes
const RequireAuth = ({ children, role }: { children: JSX.Element, role: 'tournament_organizer' | 'rating_officer' }) => {
  const userJSON = localStorage.getItem('ncr_current_user');
  const { toast } = useToast();
  
  if (!userJSON) {
    toast({
      title: "Authentication Required",
      description: "Please log in to access this page",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(userJSON);
    if (user.role !== role) {
      toast({
        title: "Access Denied",
        description: `This page is only accessible to ${role === 'tournament_organizer' ? 'Tournament Organizers' : 'Rating Officers'}`,
        variant: "destructive",
      });
      return <Navigate to="/login" replace />;
    }
    
    return children;
  } catch (error) {
    console.error("Error parsing user data:", error);
    localStorage.removeItem('ncr_current_user');
    return <Navigate to="/login" replace />;
  }
};

// Main App component with error boundary and device detection
function App() {
  // Add console logging to help with debugging
  console.log("App component rendering");
  
  // Check for mobile devices to apply optimizations
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      document.body.classList.add('mobile-optimized', 'safari-fix');
    }
    
    // Check browser storage availability to ensure data persistence
    try {
      localStorage.setItem('storage_test', 'test');
      localStorage.removeItem('storage_test');
    } catch (e) {
      console.error('Local storage is not available. This may affect application functionality.');
    }
    
    // Log device info for debugging
    console.log(`Device: ${window.navigator.userAgent}`);
    console.log(`Screen size: ${window.innerWidth}x${window.innerHeight}`);
  }, []);

  return (
    <ErrorBoundary>
      <UserProvider>
        <Router>
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
