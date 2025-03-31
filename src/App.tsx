import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { SupabaseAuthProvider, useSupabaseAuth } from './contexts/SupabaseAuthContext';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { setupNetworkDebugger } from '@/utils/networkDebugger';
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
import NotFound from './pages/NotFound';

// Higher-order component for protected routes using Supabase Auth
const RequireAuth = ({ children, role }: { children: JSX.Element, role: 'tournament_organizer' | 'rating_officer' }) => {
  const { toast } = useToast();
  const { user, isLoading, isRatingOfficer, isTournamentOrganizer } = useSupabaseAuth();
  
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access this page",
        variant: "destructive",
      });
    } else if (!isLoading && user) {
      const hasRequiredRole = 
        (role === 'rating_officer' && isRatingOfficer) || 
        (role === 'tournament_organizer' && isTournamentOrganizer);
      
      if (!hasRequiredRole) {
        toast({
          title: "Access Denied",
          description: `This page is only accessible to ${role === 'tournament_organizer' ? 'Tournament Organizers' : 'Rating Officers'}`,
          variant: "destructive",
        });
      }
      
      if (role === 'tournament_organizer' && isTournamentOrganizer) {
        const isApproved = user.user_metadata?.status === 'approved';
        
        if (!isApproved) {
          toast({
            title: "Account Pending Approval",
            description: "Your account is pending approval by a rating officer.",
            variant: "destructive",
          });
        }
      }
    }
  }, [isLoading, user, role, toast, isRatingOfficer, isTournamentOrganizer]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nigeria-green"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const hasRequiredRole = 
    (role === 'rating_officer' && isRatingOfficer) || 
    (role === 'tournament_organizer' && isTournamentOrganizer);
  
  if (!hasRequiredRole) {
    return <Navigate to="/login" replace />;
  }
  
  if (role === 'tournament_organizer' && isTournamentOrganizer) {
    const isApproved = user.user_metadata?.status === 'approved';
    
    if (!isApproved) {
      return <Navigate to="/login" replace />;
    }
  }
  
  return children;
};

// Enhanced App component with improved initialization and error handling
function App() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const initializeApp = async () => {
      logMessage(LogLevel.INFO, 'App', "Initializing application");
      
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
          logMessage(LogLevel.INFO, 'App', "Storage availability check passed");
        } catch (e) {
          logMessage(LogLevel.ERROR, 'App', 'Local storage is not available. This may affect application functionality.', e);
          toast({
            title: "Storage Access Error",
            description: "Your browser may be blocking access to local storage. Try disabling private browsing mode or clearing cookies.",
            variant: "destructive",
          });
        }
        
        const isMobile = window.innerWidth < 768;
        if (isMobile) {
          document.body.classList.add('mobile-optimized', 'safari-fix');
          logMessage(LogLevel.INFO, 'App', "Mobile device detected, optimizations applied");
        }
        
        window.addEventListener('online', () => {
          logMessage(LogLevel.INFO, 'App', "Device came online");
        });
        
        window.addEventListener('offline', () => {
          logMessage(LogLevel.WARNING, 'App', "Device went offline");
        });
        
        setIsInitialized(true);
        logMessage(LogLevel.INFO, 'App', "Application initialization complete");
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
                    <RequireAuth role="tournament_organizer">
                      <OrganizerDashboard />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="/officer/*" 
                  element={
                    <RequireAuth role="rating_officer">
                      <OfficerDashboard />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="/manage/tournament/:id" 
                  element={
                    <RequireAuth role="tournament_organizer">
                      <TournamentManagement />
                    </RequireAuth>
                  } 
                />
                <Route 
                  path="/tournament/:id/manage" 
                  element={
                    <RequireAuth role="tournament_organizer">
                      <TournamentManagement />
                    </RequireAuth>
                  } 
                />
                <Route path="/tournaments" element={<Tournaments />} />
                <Route path="/tournament/:id" element={<TournamentDetails />} />
                <Route path="/players" element={<Players />} />
                <Route path="/player/:id" element={<PlayerProfile />} />
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
