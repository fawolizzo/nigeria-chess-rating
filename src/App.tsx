
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import { useToast } from '@/components/ui/use-toast';
import { forceSyncAllStorage, getFromStorage, checkStorageHealth, initializeStorageListeners } from '@/utils/storageUtils';
import { STORAGE_KEY_CURRENT_USER } from '@/types/userTypes';

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

// Higher-order component for protected routes with robust cross-device auth checking
const RequireAuth = ({ children, role }: { children: JSX.Element, role: 'tournament_organizer' | 'rating_officer' }) => {
  const { toast } = useToast();

  // Force sync storage and check health to ensure we have the latest user data
  const syncResult = forceSyncAllStorage();
  
  if (!syncResult) {
    console.warn("[RequireAuth] Storage sync issues detected");
  }
  
  // Get the current user from storage directly (not from context)
  // Extract from either new format (with timestamp) or legacy format
  const storedUserData = getFromStorage(STORAGE_KEY_CURRENT_USER, null);
  
  let user = null;
  if (storedUserData?.data) {
    // New format with timestamp
    user = storedUserData.data;
  } else if (storedUserData) {
    // Legacy format
    user = storedUserData;
  }
  
  if (!user) {
    console.log("[RequireAuth] No user found in storage, redirecting to login");
    toast({
      title: "Authentication Required",
      description: "Please log in to access this page",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  // Check if the user has the required role
  if (user.role !== role) {
    console.log(`[RequireAuth] User role (${user.role}) doesn't match required role (${role}), redirecting to login`);
    toast({
      title: "Access Denied",
      description: `This page is only accessible to ${role === 'tournament_organizer' ? 'Tournament Organizers' : 'Rating Officers'}`,
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  // Check if the user status is approved
  if (role === 'tournament_organizer' && user.status !== 'approved') {
    console.log(`[RequireAuth] Tournament organizer not approved (status: ${user.status}), redirecting to login`);
    toast({
      title: "Account Pending Approval",
      description: "Your account is pending approval by a Rating Officer",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  console.log(`[RequireAuth] Access granted to ${role} page for ${user.email}`);
  return children;
};

// Main App component with enhanced error boundary and improved device detection
function App() {
  const { toast } = useToast();
  
  // Initialize app on load with better storage handling
  useEffect(() => {
    console.log("[App] Initializing application");
    
    try {
      // Initialize storage event listeners
      initializeStorageListeners();
      
      // Check storage health and recover if needed
      checkStorageHealth();
      
      // Force sync storage on app load
      const syncResult = forceSyncAllStorage();
      if (!syncResult) {
        console.warn("[App] Storage sync issues detected at initialization");
        toast({
          title: "Storage Sync Warning",
          description: "There may be issues with data synchronization across devices. If you experience login issues, try clearing your browser cache.",
          variant: "warning"
        });
      }
      
      // Check for mobile devices to apply optimizations
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.body.classList.add('mobile-optimized', 'safari-fix');
        console.log("[App] Mobile device detected, optimizations applied");
      }
      
      // Check browser storage availability to ensure data persistence
      try {
        localStorage.setItem('storage_test', 'test');
        localStorage.removeItem('storage_test');
        console.log("[App] Storage availability check passed");
      } catch (e) {
        console.error('[App] Local storage is not available. This may affect application functionality.', e);
        toast({
          title: "Storage Access Error",
          description: "Your browser may be blocking access to local storage. Try disabling private browsing mode or clearing cookies.",
          variant: "destructive",
        });
      }
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log("[App] Device came online");
        toast({
          title: "Back Online",
          description: "Your internet connection has been restored. Data will now synchronize.",
        });
        forceSyncAllStorage();
      });
      
      window.addEventListener('offline', () => {
        console.log("[App] Device went offline");
        toast({
          title: "Offline Mode",
          description: "You are currently offline. Some features may be limited.",
          variant: "warning",
        });
      });
      
      // Ensure consistent storage across devices and browsers
      window.addEventListener('storage', (event) => {
        console.log(`[App] Storage event detected for ${event.key}`);
        
        if (event.key === STORAGE_KEY_CURRENT_USER) {
          console.log("[App] Current user changed in another tab/window, reloading");
          // If the user logged in or out in another tab, reload to reflect those changes
          window.location.reload();
        }
      });
    } catch (error) {
      console.error("[App] Error initializing application:", error);
      toast({
        title: "Initialization Error",
        description: "There was a problem starting the application. Please refresh the page.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <UserProvider>
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
    </UserProvider>
  );
}

export default App;
