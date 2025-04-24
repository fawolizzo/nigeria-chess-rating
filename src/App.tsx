
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Router, Routes, Route, Navigate } from 'react-router-dom';
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
import CreateTournament from '@/pages/CreateTournament';
import NotFound from '@/pages/NotFound';
import PendingApproval from '@/pages/PendingApproval';
import SystemTesting from '@/pages/SystemTesting';
import CrossPlatformTesting from '@/pages/CrossPlatformTesting';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncr-theme">
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/players" element={<Players />} />
          <Route path="/player/:id" element={<PlayerProfile />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/tournament/:id" element={<TournamentDetails />} />
          
          {/* Dashboard routes */}
          <Route path="/officer-dashboard" element={<OfficerDashboard />} />
          <Route path="/officer" element={<Navigate to="/officer-dashboard" replace />} />
          <Route path="/organizer-dashboard" element={<OrganizerDashboard />} />
          <Route path="/organizer" element={<Navigate to="/organizer-dashboard" replace />} />
          
          {/* Tournament management routes */}
          <Route path="/tournaments/new" element={<CreateTournament />} />
          <Route path="/tournament-management/:id" element={<TournamentManagement />} />
          <Route path="/tournament-management" element={<TournamentManagement />} />
          
          {/* System routes */}
          <Route path="/system-testing" element={<SystemTesting />} />
          <Route path="/cross-platform-testing" element={<CrossPlatformTesting />} />
          
          {/* Error handling */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </ThemeProvider>
  );
}

export default App;
