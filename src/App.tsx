import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from '@/contexts/user';

import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import About from '@/pages/About';
import PendingApproval from '@/pages/PendingApproval';
import Tournaments from '@/pages/Tournaments';
import TournamentDetails from '@/pages/TournamentDetails';
import TournamentManagement from '@/pages/TournamentManagement';
import CreateTournament from '@/pages/CreateTournament';
import Players from '@/pages/Players';
import PlayerProfile from '@/pages/PlayerProfile';

// Auth pages
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';
import ConfirmationSent from '@/pages/auth/ConfirmationSent';
import ConfirmEmail from '@/pages/auth/ConfirmEmail';
import RegisterOrganizer from '@/pages/auth/RegisterOrganizer';
import HealthCheck from '@/pages/HealthCheck';

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

              {/* Auth routes */}
              <Route
                path="/auth/forgot-password"
                element={<ForgotPassword />}
              />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              <Route
                path="/auth/confirmation-sent"
                element={<ConfirmationSent />}
              />
              <Route path="/auth/confirm-email" element={<ConfirmEmail />} />
              <Route
                path="/register-organizer"
                element={<RegisterOrganizer />}
              />

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
              <Route path="/health" element={<HealthCheck />} />
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
