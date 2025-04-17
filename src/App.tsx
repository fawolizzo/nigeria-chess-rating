
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Home from '@/pages/Index';
import About from '@/pages/About';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import OfficerDashboard from '@/pages/OfficerDashboard';
import OrganizerDashboard from '@/pages/OrganizerDashboard';
import Players from '@/pages/Players';
import PlayerProfile from '@/pages/PlayerProfile';
import Tournaments from '@/pages/Tournaments';
import TournamentDetails from '@/pages/TournamentDetails';
import TournamentManagement from '@/pages/TournamentManagement';
import NotFound from '@/pages/NotFound';
import SystemTesting from '@/pages/SystemTesting';
import CrossPlatformTesting from '@/pages/CrossPlatformTesting';
import PendingApproval from '@/pages/PendingApproval';
import { logMessage, LogLevel } from '@/utils/debugLogger';

function App() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Basic app initialization
        logMessage(LogLevel.INFO, 'App', 'Initializing application');
        setIsInitialized(true);
      } catch (error) {
        logMessage(LogLevel.ERROR, 'App', 'Error initializing application:', error);
        console.error('App initialization error:', error);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nigeria-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider defaultTheme="light" storageKey="ncr-theme">
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
          <Route path="/officer" element={<Navigate to="/officer-dashboard" replace />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer" element={<Navigate to="/organizer-dashboard" replace />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/players" element={<Players />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournament/:id" element={<TournamentDetails />} />
          <Route path="/tournament-management/:id" element={<TournamentManagement />} />
          <Route path="/tournament-management" element={<TournamentManagement />} />
          <Route path="/system-testing" element={<SystemTesting />} />
          <Route path="/cross-platform-testing" element={<CrossPlatformTesting />} />
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
