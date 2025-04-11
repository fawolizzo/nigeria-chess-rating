
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getAllTournaments, getAllPlayers, Tournament } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage } from "@/utils/storageUtils";
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
  const loadingInProgressRef = useRef(false);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized load function that prevents concurrent operations
  const loadAllData = useCallback(async () => {
    // Prevent multiple concurrent loads
    if (loadingInProgressRef.current) {
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Data loading already in progress, skipping');
      return;
    }
    
    try {
      loadingInProgressRef.current = true;
      setIsLoading(true);
      
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Loading dashboard data');
      
      // Ensure storage is synced with a timeout for safety
      const syncPromise = Promise.race([
        Promise.all([
          syncStorage(['ncr_users']),
          syncStorage(['ncr_players']),
          syncStorage(['ncr_tournaments'])
        ]),
        new Promise(resolve => setTimeout(resolve, 3000)) // 3 second timeout
      ]);
      
      await syncPromise;
      
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
      
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardContext', "Error loading dashboard data:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading the dashboard data. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      
      // Add a small delay before allowing another load
      setTimeout(() => {
        loadingInProgressRef.current = false;
      }, 2000);
    }
  }, [forceSync, toast]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, []);
  
  // Initial load and refresh when the key changes
  useEffect(() => {
    // Clear any existing timeout
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }
    
    // Load data immediately
    loadAllData();
    
    // Set a much longer interval for auto refresh (5 minutes)
    // This dramatically reduces UI freezing
    dataTimeoutRef.current = setTimeout(() => {
      loadAllData();
    }, 300000); // Refresh every 5 minutes
    
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [refreshKey, loadAllData]);
  
  const refreshDashboard = useCallback(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Manual dashboard refresh requested');
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Dashboard refreshed",
      description: "The dashboard has been refreshed with the latest data.",
    });
  }, [toast]);
  
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
