
import { useState, useCallback, useRef } from "react";
import { getAllTournaments, getAllPlayers, Tournament } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage } from "@/utils/storageUtils";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { OfficerDashboardState } from "./types";

export const useOfficerDashboardData = () => {
  const { toast } = useToast();
  const { forceSync } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);
  const [dashboardState, setDashboardState] = useState<OfficerDashboardState>({
    pendingTournaments: [],
    completedTournaments: [],
    pendingPlayers: [],
    pendingOrganizers: [],
    isLoading: true,
  });
  const loadingInProgressRef = useRef(false);
  const loadAttemptsRef = useRef(0);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const loadAllData = useCallback(async () => {
    // Prevent multiple concurrent loads and limit retries
    if (loadingInProgressRef.current) {
      logMessage(LogLevel.INFO, 'OfficerDashboardData', 'Data loading already in progress, skipping');
      return;
    }
    
    loadAttemptsRef.current += 1;
    loadingInProgressRef.current = true;
    
    try {
      setDashboardState(prev => ({ ...prev, isLoading: true }));
      
      logMessage(LogLevel.INFO, 'OfficerDashboardData', 'Loading dashboard data');
      
      // Try syncing with timeout
      try {
        const syncPromise = async () => {
          await forceSync();
          await Promise.all([
            syncStorage(['ncr_users']),
            syncStorage(['ncr_players']),
            syncStorage(['ncr_tournaments'])
          ]);
        };
        
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Storage sync timed out'));
          }, 3000);
        });
        
        await Promise.race([syncPromise(), timeoutPromise]);
      } catch (timeoutErr) {
        logMessage(LogLevel.WARNING, 'OfficerDashboardData', 'Storage sync timed out, proceeding with local data');
      }
      
      // Load tournaments
      try {
        // First try from localStorage
        const storedTournamentsJSON = localStorage.getItem('ncr_tournaments');
        let allTournaments: Tournament[] = [];
        
        if (storedTournamentsJSON) {
          try {
            allTournaments = JSON.parse(storedTournamentsJSON);
            logMessage(LogLevel.INFO, 'OfficerDashboardData', `Loaded ${allTournaments.length} tournaments from localStorage`);
          } catch (parseError) {
            // Fallback to the getAllTournaments function
            allTournaments = getAllTournaments();
          }
        } else {
          // Fallback to getAllTournaments function if no localStorage data
          allTournaments = getAllTournaments();
        }
        
        const pending = Array.isArray(allTournaments) ? allTournaments.filter(t => t && t.status === "pending") : [];
        const completed = Array.isArray(allTournaments) ? allTournaments.filter(t => t && t.status === "completed") : [];
        
        setDashboardState(prev => ({
          ...prev,
          pendingTournaments: pending,
          completedTournaments: completed,
        }));
      } catch (tournamentError) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardData', 'Error loading tournaments:', tournamentError);
        // Set empty arrays rather than failing completely
        setDashboardState(prev => ({
          ...prev,
          pendingTournaments: [],
          completedTournaments: [],
        }));
      }
      
      // Load pending players
      try {
        const allPlayers = getAllPlayers();
        setDashboardState(prev => ({
          ...prev,
          pendingPlayers: Array.isArray(allPlayers) ? allPlayers.filter(p => p && p.status === "pending") : []
        }));
      } catch (playerError) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardData', 'Error loading players:', playerError);
        setDashboardState(prev => ({ ...prev, pendingPlayers: [] }));
      }
      
      // Load pending organizers
      try {
        const allUsers = getAllUsersFromStorage();
        const filteredOrganizers = Array.isArray(allUsers) ? allUsers.filter(
          (user) => user && user.role === "tournament_organizer" && user.status === "pending"
        ) : [];
        
        setDashboardState(prev => ({ ...prev, pendingOrganizers: filteredOrganizers }));
      } catch (organizerError) {
        logMessage(LogLevel.ERROR, 'OfficerDashboardData', 'Error loading organizers:', organizerError);
        setDashboardState(prev => ({ ...prev, pendingOrganizers: [] }));
      }
      
      logMessage(LogLevel.INFO, 'OfficerDashboardData', 'Dashboard data loaded successfully');
      
    } catch (error) {
      logMessage(LogLevel.ERROR, 'OfficerDashboardData', "Error loading dashboard data:", error);
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading the dashboard data. Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setDashboardState(prev => ({ ...prev, isLoading: false }));
      
      // Add a small delay before allowing another load
      setTimeout(() => {
        loadingInProgressRef.current = false;
      }, 1000);
    }
  }, [toast, forceSync]);
  
  const refreshDashboard = useCallback(() => {
    logMessage(LogLevel.INFO, 'OfficerDashboardData', 'Manual dashboard refresh requested');
    setRefreshKey(prev => prev + 1);
    loadAttemptsRef.current = 0; // Reset attempt counter on manual refresh
    toast({
      title: "Refreshing dashboard...",
      description: "The dashboard is being refreshed with the latest data.",
    });
  }, [toast]);
  
  return {
    ...dashboardState,
    refreshDashboard,
    refreshKey,
    loadAllData,
    dataTimeoutRef,
  };
};
