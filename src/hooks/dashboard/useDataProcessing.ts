
import { DashboardData } from "./types";
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * Hook for processing dashboard data
 */
export function useDataProcessing() {
  /**
   * Process tournaments into pending and completed categories
   */
  const processTournaments = (allTournaments: any[]): Pick<DashboardData, 'pendingTournaments' | 'completedTournaments'> => {
    try {
      if (!Array.isArray(allTournaments)) {
        logMessage(LogLevel.WARNING, 'useDataProcessing', 'Tournaments data is not an array');
        return { 
          pendingTournaments: [], 
          completedTournaments: [] 
        };
      }

      const pendingTournaments = allTournaments.filter(t => t && t.status === "pending") || [];
      const completedTournaments = allTournaments.filter(t => t && t.status === "completed") || [];
      
      logMessage(LogLevel.INFO, 'useDataProcessing', `Processed ${pendingTournaments.length} pending and ${completedTournaments.length} completed tournaments`);
      
      return {
        pendingTournaments,
        completedTournaments
      };
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDataProcessing', 'Error processing tournaments:', error);
      return { 
        pendingTournaments: [], 
        completedTournaments: [] 
      };
    }
  };

  /**
   * Process players to filter pending ones
   */
  const processPendingPlayers = (allPlayers: any[]): Pick<DashboardData, 'pendingPlayers'> => {
    try {
      if (!Array.isArray(allPlayers)) {
        return { pendingPlayers: [] };
      }
      
      const pendingPlayers = allPlayers.filter(p => p && p.status === "pending") || [];
      return { pendingPlayers };
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDataProcessing', 'Error processing players:', error);
      return { pendingPlayers: [] };
    }
  };

  /**
   * Process organizers to filter pending ones
   */
  const processPendingOrganizers = (allUsers: any[]): Pick<DashboardData, 'pendingOrganizers'> => {
    try {
      if (!Array.isArray(allUsers)) {
        return { pendingOrganizers: [] };
      }
      
      const pendingOrganizers = allUsers.filter(
        user => user && user.role === "tournament_organizer" && user.status === "pending"
      ) || [];
      
      return { pendingOrganizers };
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDataProcessing', 'Error processing organizers:', error);
      return { pendingOrganizers: [] };
    }
  };

  return {
    processTournaments,
    processPendingPlayers,
    processPendingOrganizers
  };
}
