
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
  
  // Optimized load function with improved error handling
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
      
      // Force synchronization of critical storage before loading data
      // This ensures we have the latest data from localStorage
      await forceSync();
      await Promise.all([
        syncStorage(['ncr_users']),
        syncStorage(['ncr_players']),
        syncStorage(['ncr_tournaments'])
      ]);
      
      // Load tournaments directly from localStorage for most up-to-date data
      const storedTournamentsJSON = localStorage.getItem('ncr_tournaments');
      let allTournaments: Tournament[] = [];
      
      if (storedTournamentsJSON) {
        try {
          allTournaments = JSON.parse(storedTournamentsJSON);
          
          // Debug the parsed tournaments
          logMessage(LogLevel.INFO, 'OfficerDashboardContext', `Successfully parsed ${allTournaments.length} tournaments from localStorage`);
          console.log("Parsed tournaments:", allTournaments);
        } catch (parseError) {
          logMessage(LogLevel.ERROR, 'OfficerDashboardContext', 'Error parsing tournaments from localStorage:', parseError);
          // Fallback to the getAllTournaments function
          allTournaments = getAllTournaments();
        }
      } else {
        // Fallback to getAllTournaments function if no localStorage data
        allTournaments = getAllTournaments();
        logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'No tournaments in localStorage, using getAllTournaments() function');
      }
      
      // Debug the tournaments found - this will help find issues
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', `Found ${allTournaments.length} total tournaments:`, 
        allTournaments.map(t => ({ id: t.id, name: t.name, status: t.status })));
      
      const pending = allTournaments.filter(t => t.status === "pending");
      const completed = allTournaments.filter(t => t.status === "completed");
      
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', `Filtered tournaments: ${pending.length} pending, ${completed.length} completed`);
      console.log("Pending tournaments:", pending);
      console.log("Completed tournaments:", completed);
      
      setPendingTournaments(pending);
      setCompletedTournaments(completed);
      
      // Load pending players
      const allPlayers = getAllPlayers();
      setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
      
      // Load pending organizers directly from storage for the most up-to-date data
      const allUsers = getAllUsersFromStorage();
      const filteredOrganizers = allUsers.filter(
        (user) => user.role === "tournament_organizer" && user.status === "pending"
      );
      setPendingOrganizers(filteredOrganizers);
      
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Dashboard data loaded successfully');
      
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
      }, 1000);
    }
  }, [toast, forceSync]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, []);
  
  // Set up storage event listener for real-time updates
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'ncr_tournaments') {
        logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Tournament data changed in another window/tab, refreshing');
        loadAllData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [loadAllData]);
  
  // Load data on mount and when refreshKey changes (manual refresh)
  useEffect(() => {
    // Clear any existing timeout
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }
    
    // Load data immediately - only when component mounts or refresh is triggered
    loadAllData();
    
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
      title: "Refreshing dashboard...",
      description: "The dashboard is being refreshed with the latest data.",
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
