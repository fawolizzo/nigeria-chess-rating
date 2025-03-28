import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { 
  forceSyncAllStorage, 
  checkStorageHealth,
  initializeStorageListeners 
} from '@/utils/storageUtils';
import { STORAGE_KEY_CURRENT_USER } from '@/types/userTypes';
import { 
  initBroadcastChannel, 
  checkResetStatus, 
  clearResetStatus 
} from '@/utils/storageSync';
import { logMessage, LogLevel, logSyncEvent } from '@/utils/debugLogger';

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
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const checkAuth = async () => {
      setIsChecking(true);
      
      try {
        // Force sync storage and check health to ensure we have the latest user data
        logMessage(LogLevel.INFO, 'RequireAuth', "Checking authentication and syncing storage");
        const syncResult = await forceSyncAllStorage();
        
        if (!syncResult) {
          logMessage(LogLevel.WARNING, 'RequireAuth', "Storage sync issues detected");
        }
        
        // Check for system reset
        if (checkResetStatus()) {
          logMessage(LogLevel.WARNING, 'RequireAuth', "System reset detected, redirecting to login");
          setIsAuthorized(false);
          setUser(null);
          clearResetStatus();
          return;
        }
        
        // Get the current user from storage directly (not from context)
        const storedUserData = await localStorage.getItem(STORAGE_KEY_CURRENT_USER);
        
        if (!storedUserData) {
          logMessage(LogLevel.INFO, 'RequireAuth', "No user found in storage, redirecting to login");
          setIsAuthorized(false);
          setUser(null);
          return;
        }
        
        // Parse user data from storage
        let userData;
        try {
          const parsed = JSON.parse(storedUserData);
          
          // Extract from either new format (with timestamp) or legacy format
          if (parsed?.data) {
            // New format with timestamp
            userData = parsed.data;
          } else {
            // Legacy format
            userData = parsed;
          }
          
          setUser(userData);
          logMessage(LogLevel.INFO, 'RequireAuth', `Parsed user data for ${userData?.email || 'unknown user'}`);
        } catch (e) {
          logMessage(LogLevel.ERROR, 'RequireAuth', "Failed to parse user data:", e);
          setIsAuthorized(false);
          setUser(null);
          return;
        }
        
        // Check if the user has the required role
        if (userData.role !== role) {
          logMessage(LogLevel.WARNING, 'RequireAuth', `User role (${userData.role}) doesn't match required role (${role}), redirecting to login`);
          setIsAuthorized(false);
          return;
        }
        
        // Check if the user status is approved
        if (role === 'tournament_organizer' && userData.status !== 'approved') {
          logMessage(LogLevel.WARNING, 'RequireAuth', `Tournament organizer not approved (status: ${userData.status}), redirecting to login`);
          setIsAuthorized(false);
          return;
        }
        
        logMessage(LogLevel.INFO, 'RequireAuth', `Access granted to ${role} page for ${userData.email}`);
        setIsAuthorized(true);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'RequireAuth', "Error checking authentication:", error);
        setIsAuthorized(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAuth();
  }, [role, toast]);
  
  if (isChecking) {
    // Show loading state
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nigeria-green"></div>
      </div>
    );
  }
  
  if (!isAuthorized) {
    toast({
      title: user ? "Access Denied" : "Authentication Required",
      description: user 
        ? `This page is only accessible to ${role === 'tournament_organizer' ? 'Tournament Organizers' : 'Rating Officers'}`
        : "Please log in to access this page",
      variant: "destructive",
    });
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

// Enhanced App component with improved initialization
function App() {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize app on load with better storage handling
  useEffect(() => {
    const initializeApp = async () => {
      logMessage(LogLevel.INFO, 'App', "Initializing application");
      
      try {
        // Check for system reset
        if (checkResetStatus()) {
          logMessage(LogLevel.WARNING, 'App', "System reset detected, clearing reset status");
          clearResetStatus();
          toast({
            title: "System Reset Detected",
            description: "The system has been reset. You'll need to register or log in again.",
          });
        }
        
        // Initialize broadcast channel
        initBroadcastChannel();
        logMessage(LogLevel.INFO, 'App', "Broadcast channel initialized");
        
        // Initialize storage event listeners
        initializeStorageListeners();
        logMessage(LogLevel.INFO, 'App', "Storage event listeners initialized");
        
        // Check storage health and recover if needed
        await checkStorageHealth();
        logMessage(LogLevel.INFO, 'App', "Storage health check completed");
        
        // Force sync storage on app load
        const syncResult = await forceSyncAllStorage();
        if (!syncResult) {
          logMessage(LogLevel.WARNING, 'App', "Storage sync issues detected at initialization");
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
          logMessage(LogLevel.INFO, 'App', "Mobile device detected, optimizations applied");
        }
        
        // Check browser storage availability to ensure data persistence
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
        
        // Listen for online/offline events
        window.addEventListener('online', () => {
          logMessage(LogLevel.INFO, 'App', "Device came online");
          forceSyncAllStorage();
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
        setIsInitialized(true); // Still set to true so the app can render
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
