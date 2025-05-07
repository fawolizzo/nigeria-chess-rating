
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getAllTournaments, getAllPlayers, Tournament } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage, getFromStorage } from "@/utils/storageUtils";
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
  const loadAttemptsRef = useRef(0);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Optimized load function with improved error handling and timeouts
  const loadAllData = useCallback(async () => {
    // Prevent multiple concurrent loads and limit retries
    if (loadingInProgressRef.current) {
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Data loading already in progress, skipping');
      return;
    }
    
    if (loadAttemptsRef.current > 5) {
      logMessage(LogLevel.WARNING, 'OfficerDashboardContext', 'Exceeded maximum load attempts, showing empty data');
      setIsLoading(false);
      setPendingTournaments([]);
      setCompletedTournaments([]);
      return;
    }
    
    loadAttemptsRef.current += 1;
    loadingInProgressRef.current = true;
    
    try {
      setIsLoading(true);
      
      logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Loading dashboard data');
      
      // Use a Promise with timeout to prevent infinite loading
      const syncPromise = async () => {
        try {
          // Skip syncing on repeated attempts
          if (loadAttemptsRef.current <= 2) {
            await forceSync();
            await Promise.all([
              syncStorage(['ncr_users']),
              syncStorage(['ncr_players']),
              syncStorage(['ncr_tournaments'])
            ]);
          }
        } catch (syncError) {
          logMessage(LogLevel.ERROR, 'OfficerDashboardContext', 'Error syncing storage, continuing with local data:', syncError);
          // Continue with local data
        }
      };
      
      // Set a timeout for the sync operation
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Storage sync timed out'));
        }, 3000); // 3 second timeout
      });
      
      // Try syncing with timeout
      try {
        await Promise.race([syncPromise(), timeoutPromise]);
      } catch (timeoutErr) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContext', 'Storage sync timed out, proceeding with local data');
      }
      
      // Load tournaments directly from localStorage for most up-to-date data
      const storedTournamentsJSON = localStorage.getItem('ncr_tournaments');
      let allTournaments: Tournament[] = [];
      
      if (storedTournamentsJSON) {
        try {
          allTournaments = JSON.parse(storedTournamentsJSON);
          logMessage(LogLevel.INFO, 'OfficerDashboardContext', `Successfully parsed ${allTournaments.length} tournaments from localStorage`);
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
      
      // Allow empty arrays without throwing errors
      const pending = Array.isArray(allTournaments) ? allTournaments.filter(t => t && t.status === "pending") : [];
      const completed = Array.isArray(allTournaments) ? allTournaments.filter(t => t && t.status === "completed") : [];
      
      setPendingTournaments(pending);
      setCompletedTournaments(completed);
      
      // Load pending players
      try {
        const allPlayers = getAllPlayers();
        setPendingPlayers(Array.isArray(allPlayers) ? allPlayers.filter(p => p && p.status === "pending") : []);
      } catch (playerError) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardContext', 'Error loading players:', playerError);
        setPendingPlayers([]);
      }
      
      // Load pending organizers directly from storage for the most up-to-date data
      try {
        const allUsers = getAllUsersFromStorage();
        const filteredOrganizers = Array.isArray(allUsers) ? allUsers.filter(
          (user) => user && user.role === "tournament_organizer" && user.status === "pending"
        ) : [];
        setPendingOrganizers(filteredOrganizers);
      } catch (organizerError) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardContext', 'Error loading organizers:', organizerError);
        setPendingOrganizers([]);
      }
      
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
  // With backup timeout to prevent infinite loading state
  useEffect(() => {
    // Clear any existing timeout
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
    }
    
    // Load data immediately
    loadAllData();
    
    // Set a safety timeout to ensure loading state is cleared eventually
    dataTimeoutRef.current = setTimeout(() => {
      if (isLoading) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardContext', 'Loading dashboard data timed out, forcing completion');
        setIsLoading(false);
      }
    }, 10000); // 10 seconds max loading time
    
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [refreshKey, loadAllData, isLoading]);
  
  const refreshDashboard = useCallback(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardContext', 'Manual dashboard refresh requested');
    setRefreshKey(prev => prev + 1);
    loadAttemptsRef.current = 0; // Reset attempt counter on manual refresh
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
