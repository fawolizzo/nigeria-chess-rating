
import { useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getAllTournaments, getAllPlayers, Tournament } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage } from "@/utils/storageUtils";

/**
 * Hook for loading and syncing dashboard data from storage
 */
export function useDashboardStorage() {
  /**
   * Sync dashboard-related data in local storage
   */
  const syncDashboardStorage = useCallback(async () => {
    logMessage(LogLevel.INFO, 'useDashboardStorage', 'Syncing dashboard storage');
    
    try {
      await Promise.all([
        syncStorage(['ncr_users']),
        syncStorage(['ncr_players']),
        syncStorage(['ncr_tournaments'])
      ]);
      
      logMessage(LogLevel.INFO, 'useDashboardStorage', 'Storage sync complete');
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error syncing storage', error);
      throw error;
    }
  }, []);

  /**
   * Load tournaments from storage or fallback
   */
  const loadTournaments = useCallback((): Tournament[] => {
    try {
      const storedTournamentsJSON = localStorage.getItem('ncr_tournaments');
      let allTournaments: Tournament[] = [];
      
      if (storedTournamentsJSON) {
        try {
          allTournaments = JSON.parse(storedTournamentsJSON);
          logMessage(LogLevel.INFO, 'useDashboardStorage', `Loaded ${allTournaments.length} tournaments from localStorage`);
        } catch (parseError) {
          // Fallback to the getAllTournaments function
          allTournaments = getAllTournaments();
          logMessage(LogLevel.WARNING, 'useDashboardStorage', 'Error parsing tournaments from localStorage, using fallback data');
        }
      } else {
        // Fallback to getAllTournaments function if no localStorage data
        allTournaments = getAllTournaments();
        logMessage(LogLevel.INFO, 'useDashboardStorage', 'No tournaments in localStorage, using fallback data');
      }
      
      return Array.isArray(allTournaments) ? allTournaments : [];
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading tournaments:', error);
      return [];
    }
  }, []);

  /**
   * Load players from storage or fallback
   */
  const loadPlayers = useCallback(() => {
    try {
      return getAllPlayers();
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading players:', error);
      return [];
    }
  }, []);

  /**
   * Load organizers from storage
   */
  const loadOrganizers = useCallback(() => {
    try {
      return getAllUsersFromStorage();
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading organizers:', error);
      return [];
    }
  }, []);

  return {
    syncDashboardStorage,
    loadTournaments,
    loadPlayers,
    loadOrganizers
  };
}
