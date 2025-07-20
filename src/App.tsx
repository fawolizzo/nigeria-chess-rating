import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import { UserProvider } from '@/contexts/user';

import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import About from '@/pages/About';
import PendingApproval from '@/pages/PendingApproval';
import SystemTesting from '@/pages/SystemTesting';
import CrossPlatformTesting from '@/pages/CrossPlatformTesting';
import Tournaments from '@/pages/Tournaments';
import TournamentDetails from '@/pages/TournamentDetails';
import TournamentManagement from '@/pages/TournamentManagement';
import CreateTournament from '@/pages/CreateTournament';
import Players from '@/pages/Players';
import PlayerProfile from '@/pages/PlayerProfile';
import TestStorage from '@/pages/TestStorage';

// Import dashboard components
import NewOfficerDashboard from '@/pages/NewOfficerDashboard';
import NewOrganizerDashboard from '@/pages/NewOrganizerDashboard';

function App() {
  const storedTheme = localStorage.getItem('vite-ui-theme') || 'light';

  useEffect(() => {
    document.documentElement.dataset.theme = storedTheme;
  }, [storedTheme]);

  return (
    <SupabaseAuthProvider>
      <UserProvider>
        <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/pending-approval" element={<PendingApproval />} />

              {/* Dashboard routes - use only the new ones */}
              <Route
                path="/officer-dashboard"
                element={<NewOfficerDashboard />}
              />
              <Route
                path="/organizer-dashboard"
                element={<NewOrganizerDashboard />}
              />

              {/* Redirect legacy dashboard routes to new ones */}
              <Route
                path="/old-officer-dashboard"
                element={<Navigate to="/officer-dashboard" replace />}
              />
              <Route
                path="/old-organizer-dashboard"
                element={<Navigate to="/organizer-dashboard" replace />}
              />

              <Route path="/system-testing" element={<SystemTesting />} />
              <Route
                path="/cross-platform"
                element={<CrossPlatformTesting />}
              />
              <Route path="/tournaments" element={<Tournaments />} />
              <Route path="/tournaments/:id" element={<TournamentDetails />} />
              <Route
                path="/tournament-management/:id"
                element={<TournamentManagement />}
              />
              <Route
                path="/tournament-management/new"
                element={<CreateTournament />}
              />
              <Route path="/players" element={<Players />} />
              <Route path="/players/:id" element={<PlayerProfile />} />
              <Route path="/test-storage" element={<TestStorage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </ThemeProvider>
      </UserProvider>
    </SupabaseAuthProvider>
  );
}

export default App;
