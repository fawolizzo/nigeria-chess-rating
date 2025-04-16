
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import OfficerDashboard from "@/pages/OfficerDashboard";
import TournamentManagement from "@/pages/TournamentManagement";
import PlayerView from "@/pages/PlayerView";
import Tournaments from "@/pages/Tournaments";
import SystemTesting from "@/pages/SystemTesting";
import { ThemeProvider } from "@/components/theme-provider";
import { useEffect } from "react";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";

function App() {
  const { refreshUserData, forceSync } = useUser();
  
  // Refresh data on mount and set up periodic refresh
  useEffect(() => {
    const initialSync = async () => {
      try {
        // First try a regular refresh
        await refreshUserData();
        
        // Then do a full sync (will download from Supabase if available)
        const syncResult = await forceSync();
        logMessage(
          LogLevel.INFO, 
          'App', 
          `Initial sync ${syncResult ? 'succeeded' : 'failed or partially succeeded'}`
        );
      } catch (error) {
        logMessage(LogLevel.ERROR, 'App', 'Error during initial data sync:', error);
      }
    };
    
    initialSync();
    
    // Set up periodic refresh
    const refreshInterval = setInterval(() => {
      refreshUserData().catch(error => {
        logMessage(LogLevel.ERROR, 'App', 'Error during periodic data refresh:', error);
      });
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(refreshInterval);
  }, [refreshUserData, forceSync]);
  
  return (
    <ThemeProvider defaultTheme="light" storageKey="ncr-theme-preference">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/officer-dashboard" element={<OfficerDashboard />} />
        <Route path="/player/:id" element={<PlayerView />} />
        <Route path="/tournament/:id" element={<TournamentManagement />} />
        <Route path="/tournaments" element={<Tournaments />} />
        <Route path="/system-testing" element={<SystemTesting />} />
      </Routes>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
