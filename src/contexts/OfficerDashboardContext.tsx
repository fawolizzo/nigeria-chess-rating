
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getAllTournaments, getAllPlayers, Tournament } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage, forceSyncAllStorage } from "@/utils/storageUtils";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";

interface DashboardContextType {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: any[];
  pendingOrganizers: any[];
  refreshDashboard: () => void;
  isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const OfficerDashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const { forceSync } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingTournaments, setPendingTournaments] = useState<any[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [pendingOrganizers, setPendingOrganizers] = useState<any[]>([]);
  
  // Optimized load function with debounce capability
  const loadAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Loading dashboard data');
      
      // Force a complete sync with a timeout to prevent freezing
      setTimeout(async () => {
        try {
          await forceSync();
          await forceSyncAllStorage();
          
          // Ensure storage is synced
          await syncStorage(['ncr_users']);
          await syncStorage(['ncr_players']);
          await syncStorage(['ncr_tournaments']);
          
          // Load tournaments based on their status
          const allTournaments = getAllTournaments();
          setPendingTournaments(allTournaments.filter(t => t.status === "pending"));
          setCompletedTournaments(allTournaments.filter(t => t.status === "completed"));
          
          // Load pending players
          const allPlayers = getAllPlayers();
          setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
          
          // Load pending organizers directly from storage for the most up-to-date data
          const allUsers = getAllUsersFromStorage();
          const filteredOrganizers = allUsers.filter(
            (user) => user.role === "tournament_organizer" && user.status === "pending"
          );
          setPendingOrganizers(filteredOrganizers);
          
          logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Dashboard data loaded');
          
          setIsLoading(false);
        } catch (error) {
          logMessage(LogLevel.ERROR, 'OfficerDashboardContext', "Error in async part:", error);
          setIsLoading(false);
        }
      }, 100);
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContext', "Error loading dashboard data:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading the dashboard data. Please try refreshing the page.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [forceSync, toast]);
  
  // Initial load and refresh when the key changes
  useEffect(() => {
    loadAllData();
    // Use a shorter interval for refreshes to prevent UI freezing
    const intervalId = setInterval(() => {
      loadAllData();
    }, 15000); // Refresh every 15 seconds
    
    return () => clearInterval(intervalId);
  }, [refreshKey, loadAllData]);
  
  const refreshDashboard = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Dashboard refreshed",
      description: "The dashboard has been refreshed with the latest data.",
    });
  };
  
  return (
    <DashboardContext.Provider 
      value={{
        pendingTournaments,
        completedTournaments,
        pendingPlayers,
        pendingOrganizers,
        refreshDashboard,
        isLoading
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within an OfficerDashboardProvider");
  }
  return context;
};
