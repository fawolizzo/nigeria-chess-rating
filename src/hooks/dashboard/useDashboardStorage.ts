
import { useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
// import { getAllTournaments, getAllPlayers, Tournament } from "@/lib/mockData"; // Removed
import { Tournament, Player, User } from "@/lib/mockData"; // Keep types
// import { getAllUsersFromStorage } from "@/utils/userUtils"; // Removed
// import { syncStorage } from "@/utils/storageUtils"; // Removed

import { getAllPlayersFromSupabase, getUsersFromSupabase } from "@/services/playerService";
import { getAllTournamentsFromSupabase } from "@/services/tournamentService";


/**
 * Hook for loading and syncing dashboard data from storage
 */
export function useDashboardStorage() {
  /**
   * Sync dashboard-related data in local storage
   */
  const syncDashboardStorage = useCallback(async () => {
    logMessage(LogLevel.INFO, 'useDashboardStorage', 'syncDashboardStorage called, no longer performs localStorage sync for core data.');
    return Promise.resolve();
  }, []);

  /**
   * Load tournaments from Supabase
   */
  const loadTournaments = useCallback(async (): Promise<Tournament[]> => {
    logMessage(LogLevel.INFO, 'useDashboardStorage', 'Loading tournaments from Supabase...');
    try {
      const tournaments = await getAllTournamentsFromSupabase({});
      logMessage(LogLevel.INFO, 'useDashboardStorage', `Loaded ${tournaments.length} tournaments.`);
      return tournaments;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading tournaments from Supabase:', error);
      return []; // Service should also handle this, but as a fallback
    }
  }, []);

  /**
   * Load players from Supabase
   */
  const loadPlayers = useCallback(async (): Promise<Player[]> => {
    logMessage(LogLevel.INFO, 'useDashboardStorage', 'Loading players from Supabase...');
    try {
      const players = await getAllPlayersFromSupabase({});
      logMessage(LogLevel.INFO, 'useDashboardStorage', `Loaded ${players.length} players.`);
      return players;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading players from Supabase:', error);
      return [];
    }
  }, []);

  /**
   * Load organizers from Supabase
   */
  const loadOrganizers = useCallback(async (): Promise<User[]> => {
    logMessage(LogLevel.INFO, 'useDashboardStorage', 'Loading organizers from Supabase...');
    try {
      // Assuming getUsersFromSupabase can filter by role
      const organizers = await getUsersFromSupabase({ role: 'tournament_organizer' });
      logMessage(LogLevel.INFO, 'useDashboardStorage', `Loaded ${organizers.length} organizers.`);
      return organizers;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDashboardStorage', 'Error loading organizers from Supabase:', error);
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
