
import { useState, useEffect, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getAllTournaments, getAllPlayers } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage } from "@/utils/storageUtils";
import { useToast } from "@/hooks/use-toast";

export type DashboardDataState = {
  pendingTournaments: any[];
  completedTournaments: any[];
  pendingPlayers: any[];
  pendingOrganizers: any[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  lastLoadTime: Date | null;
};

export function useOfficerDashboardData() {
  const { toast } = useToast();
  const [state, setState] = useState<DashboardDataState>({
    pendingTournaments: [],
    completedTournaments: [],
    pendingPlayers: [],
    pendingOrganizers: [],
    isLoading: true,
    hasError: false,
    errorMessage: null,
    lastLoadTime: null
  });

  // Function to safely fetch data with error handling
  const fetchDashboardData = useCallback(async () => {
    logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'Starting data load');
    
    // Update loading state
    setState(prev => ({ ...prev, isLoading: true, hasError: false, errorMessage: null }));

    try {
      // Sync local storage first
      try {
        await Promise.allSettled([
          syncStorage(['ncr_tournaments']),
          syncStorage(['ncr_players']),
          syncStorage(['ncr_users'])
        ]);
      } catch (syncError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardData', 'Storage sync issue, proceeding with local data', syncError);
      }

      // Tournaments data
      let allTournaments = [];
      const storedTournamentsJSON = localStorage.getItem('ncr_tournaments');
      
      if (storedTournamentsJSON) {
        try {
          allTournaments = JSON.parse(storedTournamentsJSON);
          logMessage(LogLevel.INFO, 'useOfficerDashboardData', `Loaded ${allTournaments.length} tournaments from storage`);
        } catch (parseError) {
          logMessage(LogLevel.WARNING, 'useOfficerDashboardData', 'Error parsing tournaments from storage, falling back to mock data', parseError);
          allTournaments = getAllTournaments();
        }
      } else {
        logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'No tournaments in storage, using mock data');
        allTournaments = getAllTournaments();
      }

      const pendingTournaments = allTournaments.filter(t => t && t.status === "pending") || [];
      const completedTournaments = allTournaments.filter(t => t && t.status === "completed") || [];
      
      // Players data
      const allPlayers = getAllPlayers();
      const pendingPlayers = allPlayers.filter(p => p && p.status === "pending") || [];
      
      // Organizers data
      const allUsers = getAllUsersFromStorage();
      const pendingOrganizers = allUsers.filter(user => 
        user && user.role === "tournament_organizer" && user.status === "pending"
      ) || [];

      // Update state with new data
      setState(prev => ({
        ...prev,
        pendingTournaments,
        completedTournaments,
        pendingPlayers,
        pendingOrganizers,
        isLoading: false,
        hasError: false,
        errorMessage: null,
        lastLoadTime: new Date()
      }));

      logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'Data load complete', {
        pendingTournamentsCount: pendingTournaments.length,
        completedTournamentsCount: completedTournaments.length
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
  }, [toast]);
  
  // Load data on mount
  useEffect(() => {
    fetchDashboardData();
    
    // Set up a refresh interval - every 5 minutes
    const intervalId = setInterval(() => {
      logMessage(LogLevel.INFO, 'useOfficerDashboardData', 'Automatic refresh triggered');
      fetchDashboardData();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);
  
  return {
    ...state,
    refreshData: fetchDashboardData
  };
}
