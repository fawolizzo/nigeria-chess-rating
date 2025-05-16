
import { useState, useCallback, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { DashboardState, DashboardResult } from "./types";
import { useDashboardStorage } from "./useDashboardStorage";
import { useDataProcessing } from "./useDataProcessing";
import { useRefreshScheduling } from "./useRefreshScheduling";

// Initial state for dashboard data
const initialState: DashboardState = {
  pendingTournaments: [],
  completedTournaments: [],
  pendingPlayers: [],
  pendingOrganizers: [],
  isLoading: true,
  hasError: false,
  errorMessage: null,
  lastLoadTime: null
};

/**
 * Main hook for officer dashboard data
 */
export function useOfficerDashboardData(): DashboardResult {
  const { toast } = useToast();
  const { forceSync } = useUser();
  const [state, setState] = useState<DashboardState>(initialState);
  const [refreshKey, setRefreshKey] = useState(0);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Import sub-hooks
  const { 
    syncDashboardStorage,
    loadTournaments,
    loadPlayers,
    loadOrganizers
  } = useDashboardStorage();
  
  const {
    processTournaments,
    processPendingPlayers,
    processPendingOrganizers
  } = useDataProcessing();

  /**
   * Function to fetch all dashboard data
   */
  const loadAllData = useCallback(async () => {
    logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'Starting data load');
    
    // Update loading state
    setState(prev => ({ ...prev, isLoading: true, hasError: false, errorMessage: null }));

    try {
      // First try to sync user data
      try {
        await forceSync();
      } catch (userSyncError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardData', 'Error syncing user data, continuing', userSyncError);
      }
      
      // Sync storage data
      await syncDashboardStorage();

      // Load and process tournaments
      const allTournaments = loadTournaments();
      const tournamentData = processTournaments(allTournaments);
      
      // Load and process players
      const allPlayers = loadPlayers();
      const playerData = processPendingPlayers(allPlayers);
      
      // Load and process organizers
      const allUsers = loadOrganizers();
      const organizerData = processPendingOrganizers(allUsers);

      // Update state with all processed data
      setState(prev => ({
        ...prev,
        ...tournamentData,
        ...playerData,
        ...organizerData,
        isLoading: false,
        hasError: false,
        errorMessage: null,
        lastLoadTime: new Date()
      }));

      logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'Data load complete', {
        pendingTournamentsCount: tournamentData.pendingTournaments.length,
        completedTournamentsCount: tournamentData.completedTournaments.length,
        pendingPlayersCount: playerData.pendingPlayers.length,
        pendingOrganizersCount: organizerData.pendingOrganizers.length
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error loading dashboard data';
      
      logMessage(LogLevel.ERROR, 'useOfficerDashboardData', 'Data load failed', { error });
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
        errorMessage
      }));
      
      toast({
        title: "Dashboard Data Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast, forceSync, syncDashboardStorage, loadTournaments, loadPlayers, loadOrganizers, 
       processTournaments, processPendingPlayers, processPendingOrganizers]);
  
  // Manual refresh function that updates refreshKey to trigger a reload
  const refreshData = useCallback(() => {
    setRefreshKey(prev => prev + 1);
    logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'Manual refresh triggered');
  }, []);
  
  // Set up refresh scheduling
  const { setupRefreshInterval } = useRefreshScheduling(loadAllData);
  
  // Load data on mount and setup refresh interval
  useEffect(() => {
    loadAllData();
    setupRefreshInterval(5); // Refresh every 5 minutes
    
    // Clean up timeout on unmount
    return () => {
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [loadAllData, setupRefreshInterval, refreshKey]);
  
  return {
    ...state,
    refreshData,
    loadAllData,
    refreshKey,
    dataTimeoutRef
  };
}
