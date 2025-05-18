
import { useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { Tournament } from "@/lib/mockData";

/**
 * Hook for processing dashboard data
 */
export function useDataProcessing() {
  /**
   * Process and filter tournaments by status
   */
  const processTournaments = useCallback((allTournaments: Tournament[]) => {
    try {
      const pending = Array.isArray(allTournaments) 
        ? allTournaments.filter(t => t && t.status === "pending") 
        : [];
      
      const completed = Array.isArray(allTournaments) 
        ? allTournaments.filter(t => t && t.status === "completed") 
        : [];
      
      logMessage(LogLevel.INFO, 'useDataProcessing', `Processed tournaments: ${pending.length} pending, ${completed.length} completed`);
      
      return { 
        pendingTournaments: pending, 
        completedTournaments: completed 
      };
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDataProcessing', 'Error processing tournaments:', error);
      return { 
        pendingTournaments: [], 
        completedTournaments: [] 
      };
    }
  }, []);

  /**
   * Process and filter pending players
   */
  const processPendingPlayers = useCallback((allPlayers: any[]) => {
    try {
      const pendingPlayers = Array.isArray(allPlayers) 
        ? allPlayers.filter(p => p && p.status === "pending") 
        : [];
      
      return { pendingPlayers };
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDataProcessing', 'Error processing players:', error);
      return { pendingPlayers: [] };
    }
  }, []);

  /**
   * Process and filter pending organizers
   */
  const processPendingOrganizers = useCallback((allUsers: any[]) => {
    try {
      const pendingOrganizers = Array.isArray(allUsers) 
        ? allUsers.filter(user => user && user.role === "tournament_organizer" && user.status === "pending")
        : [];
      
      return { pendingOrganizers };
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useDataProcessing', 'Error processing organizers:', error);
      return { pendingOrganizers: [] };
    }
  }, []);

  return {
    processTournaments,
    processPendingPlayers,
    processPendingOrganizers
  };
}
