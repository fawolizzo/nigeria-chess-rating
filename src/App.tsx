import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { SupabaseAuthProvider } from './services/auth/SupabaseAuthProvider';
import { useUser } from './contexts/UserContext';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { setupNetworkDebugger } from '@/utils/networkDebugger';
import { detectPlatform } from '@/utils/storageSync';
import ErrorBoundary from '@/components/ErrorBoundary';

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
import CrossPlatformTesting from './pages/CrossPlatformTesting';
import NotFound from './pages/NotFound';

// Simple auth route component that uses the UserContext directly
const ProtectedRoute = ({ children, role }: { children: JSX.Element, role: 'tournament_organizer' | 'rating_officer' }) => {
  const { toast } = useToast();
  const { currentUser, isLoading } = useUser();
  
  useEffect(() => {
    if (!isLoading && !currentUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
    } else if (!isLoading && currentUser && currentUser.role !== role) {
      toast({
        title: "Access Denied",
        description: `This page is only accessible to ${role === 'tournament_organizer' ? 'Tournament Organizers' : 'Rating Officers'}`,
        variant: "destructive",
      });
    }
  }, [isLoading, currentUser, role, toast]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nigeria-green"></div>
      </div>
    );
  }
  
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  if (currentUser.role !== role) {
    return <Navigate to="/" replace />;
  }
  
  if (role === 'tournament_organizer' && currentUser.status !== 'approved') {
    toast({
      title: "Account Pending Approval",
      description: "Your account is pending approval by a rating officer.",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Enhanced App component with improved initialization and error handling
function App() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      const platform = detectPlatform();
      logMessage(LogLevel.INFO, 'App', `Initializing application on ${platform.type} platform`);
      
      try {
        setupNetworkDebugger();
        console.log("Network debugger initialized for Supabase requests");
      } catch (e) {
        console.error("Could not initialize network debugger:", e);
      }
      
      try {
        try {
          localStorage.setItem('storage_test', 'test');
          localStorage.removeItem('storage_test');
          logMessage(LogLevel.INFO, 'App', `Storage availability check passed on ${platform.type} platform`);
        } catch (e) {
          logMessage(LogLevel.ERROR, 'App', 'Local storage is not available. This may affect application functionality.', e);
          toast({
            title: "Storage Access Error",
            description: "Your browser may be blocking access to local storage. Try disabling private browsing mode or clearing cookies.",
            variant: "destructive",
          });
        }
        
        const isMobile = platform.isMobile;
        if (isMobile) {
          document.body.classList.add('mobile-optimized', 'safari-fix');
          logMessage(LogLevel.INFO, 'App', "Mobile device detected, optimizations applied");
        }
        
        window.addEventListener('online', () => {
          logMessage(LogLevel.INFO, 'App', `Device came online (${platform.type})`);
        });
        
        window.addEventListener('offline', () => {
          logMessage(LogLevel.WARNING, 'App', `Device went offline (${platform.type})`);
        });
        
        setIsInitialized(true);
        logMessage(LogLevel.INFO, 'App', `Application initialization complete on ${platform.type} platform`);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'App', "Error initializing application:", error);
        toast({
          title: "Initialization Error",
          description: "There was a problem starting the application. Please refresh the page.",
          variant: "destructive",
        });
        setIsInitialized(true);
      }
    };
    
    initializeApp();
  }, [toast]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nigeria-green"></div>
      </div>
    );
  }

  // Get environment mode
  const isProduction = import.meta.env.PROD;

  return (
    <ErrorBoundary>
      <UserProvider>
        <SupabaseAuthProvider>
          <Router>
            <div className="app">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/about" element={<About />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route 
                  path="/organizer/*" 
                  element={
                    <ProtectedRoute role="tournament_organizer">
                      <OrganizerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/officer/*" 
                  element={
                    <ProtectedRoute role="rating_officer">
                      <OfficerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/officer/dashboard" 
                  element={
                    <ProtectedRoute role="rating_officer">
                      <OfficerDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/manage/tournament/:id" 
                  element={
                    <ProtectedRoute role="tournament_organizer">
                      <TournamentManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/tournament/:id/manage" 
                  element={
                    <ProtectedRoute role="tournament_organizer">
                      <TournamentManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournament/:id" element={<TournamentDetails />} />
                <Route path="/players" element={<Players />} />
                <Route path="/player/:id" element={<PlayerProfile />} />
                
                {/* Only include testing routes in non-production environments */}
                {!isProduction && (
                  <Route path="/cross-platform-testing" element={<CrossPlatformTesting />} />
                )}
                
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </SupabaseAuthProvider>
      </UserProvider>
    </ErrorBoundary>
  );
}

export default App;
