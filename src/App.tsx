
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import About from "./pages/About";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Players from "./pages/Players";
import Tournaments from "./pages/Tournaments";
import TournamentDetails from "./pages/TournamentDetails";
import TournamentManagement from "./pages/TournamentManagement";
import OfficerDashboard from "./pages/OfficerDashboard";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import PlayerProfile from "./pages/PlayerProfile";
import NotFound from "./pages/NotFound";
import { UserProvider, useUser } from "./contexts/UserContext";

const queryClient = new QueryClient();

// Protected route for tournament organizers
const OrganizerRoute = ({ children }) => {
  const { currentUser, isLoading } = useUser();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser || currentUser.role !== 'tournament_organizer' || currentUser.status !== 'approved') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

// Protected route for rating officers
const OfficerRoute = ({ children }) => {
  const { currentUser, isLoading } = useUser();
  
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  if (!currentUser || currentUser.role !== 'rating_officer') {
    return <Navigate to="/login" />;
  }
  
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/about" element={<About />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/players" element={<Players />} />
    <Route path="/player/:id" element={<PlayerProfile />} />
    <Route path="/tournaments" element={<Tournaments />} />
    <Route path="/tournament/:id" element={<TournamentDetails />} />
    <Route 
      path="/tournament/:id/manage" 
      element={
        <OrganizerRoute>
          <TournamentManagement />
        </OrganizerRoute>
      } 
    />
    <Route 
      path="/officer-dashboard" 
      element={
        <OfficerRoute>
          <OfficerDashboard />
        </OfficerRoute>
      } 
    />
    <Route 
      path="/organizer-dashboard" 
      element={
        <OrganizerRoute>
          <OrganizerDashboard />
        </OrganizerRoute>
      } 
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UserProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
