
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { Toaster } from '@/components/ui/toaster';
import { UserProvider } from './contexts/UserContext';

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

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="bg-gradient-to-br from-nigeria-white to-nigeria-white-dim min-h-screen">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/organizer/dashboard" element={<OrganizerDashboard />} />
            <Route path="/officer/dashboard" element={<OfficerDashboard />} />
            <Route path="/tournament/:id/manage" element={<TournamentManagement />} />
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
  );
}

export default App;
