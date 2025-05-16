
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { getAllTournaments, getAllPlayers } from "@/lib/mockData";
import { getAllUsersFromStorage } from "@/utils/userUtils";
import { syncStorage } from "@/utils/storageUtils";

/**
 * Hook for handling dashboard data storage operations
 */
export function useDashboardStorage() {
  /**
   * Synchronizes dashboard-related storage data
   */
  const syncDashboardStorage = async () => {
    try {
      await Promise.allSettled([
        syncStorage(['ncr_tournaments']),
        syncStorage(['ncr_players']),
        syncStorage(['ncr_users'])
      ]);
      logMessage(LogLevel.INFO, 'useDashboardStorage', 'Dashboard storage synced successfully');
    } catch (syncError) {
      logMessage(LogLevel.WARNING, 'useDashboardStorage', 'Storage sync issue, proceeding with local data', syncError);
    }
  };

  /**
   * Loads tournaments from storage or mock data
   */
  const loadTournaments = () => {
    try {
      const storedTournamentsJSON = localStorage.getItem('ncr_tournaments');
      
      if (storedTournamentsJSON) {
        try {
          const allTournaments = JSON.parse(storedTournamentsJSON);
          logMessage(LogLevel.INFO, 'useDashboardStorage', `Loaded ${allTournaments.length} tournaments from storage`);
          return allTournaments;
        } catch (parseError) {
          logMessage(LogLevel.WARNING, 'useDashboardStorage', 'Error parsing tournaments from storage, falling back to mock data', parseError);
          return getAllTournaments();
        }
      } else {
        logMessage(LogLevel.INFO, 'useDashboardStorage', 'No tournaments in storage, using mock data');
        return getAllTournaments();
      }
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading tournaments:', error);
      return [];
    }
  };

  /**
   * Loads players data
   */
  const loadPlayers = () => {
    try {
      return getAllPlayers();
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading players:', error);
      return [];
    }
  };

  /**
   * Loads organizer data from users storage
   */
  const loadOrganizers = () => {
    try {
      const allUsers = getAllUsersFromStorage();
      return allUsers;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading organizers:', error);
      return [];
    }
  };

  return {
    syncDashboardStorage,
    loadTournaments,
    loadPlayers,
    loadOrganizers
  };
}
