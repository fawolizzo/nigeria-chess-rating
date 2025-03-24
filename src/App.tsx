
import React, { useEffect } from 'react';
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
    
    // Ensure consistent storage across devices and browsers
    window.addEventListener('storage', (event) => {
      if (event.key === 'ncr_current_user') {
        // If the user logged in or out in another tab, reload to reflect those changes
        window.location.reload();
      }
    });
  }, []);

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
