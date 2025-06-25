import { useState, useEffect, useRef } from "react";
import { Tournament, Player } from "@/lib/mockData";
import { User } from '@/types/userTypes';
import { useDashboardStorage } from "./useDashboardStorage";
import { getFromStorage } from '@/utils/storageUtils';

export interface DashboardResult {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: Player[];
  pendingOrganizers: User[];
  isLoading: boolean;
  hasError: boolean;
  errorMessage: string | null;
  refreshData: () => void;
  dataTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}

export const useOfficerDashboardData = (): DashboardResult => {
  const { tournaments, players, isLoading: storageLoading, updateTournaments, updatePlayers } = useDashboardStorage();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Filter tournaments by status
  const pendingTournaments = tournaments.filter(t => t.status === "pending");
  const completedTournaments = tournaments.filter(t => t.status === "completed" || t.status === "approved");
  
  // Filter players by status - use the proper storage system
  const pendingPlayers = players.filter(p => p.status === "pending");

  // Load organizers from storage with error handling
  useEffect(() => {
    const loadOrganizers = () => {
      try {
        const organizers = getFromStorage('users', []);
        const pending = organizers.filter((user: User) => 
          user.role === 'tournament_organizer' && user.status === 'pending'
        );
        setPendingOrganizers(pending);
      } catch (error) {
        console.error('Error loading organizers:', error);
        setPendingOrganizers([]);
      }
    };

    loadOrganizers();
  }, []);

  // Set up real-time data refresh
  useEffect(() => {
    const refreshData = () => {
      try {
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);

        // Refresh players from storage
        const currentPlayers = getFromStorage('players', []);
        updatePlayers(currentPlayers);

        // Refresh tournaments from storage
        const currentTournaments = getFromStorage('tournaments', []);
        updateTournaments(currentTournaments);

        // Refresh organizers
        const organizers = getFromStorage('users', []);
        const pending = organizers.filter((user: User) => 
          user.role === 'tournament_organizer' && user.status === 'pending'
        );
        setPendingOrganizers(pending);

        console.log("🔄 Dashboard data refreshed:", {
          players: currentPlayers.length,
          tournaments: currentTournaments.length,
          pendingOrganizers: pending.length
        });

      } catch (error) {
        console.error('Error refreshing dashboard data:', error);
        setHasError(true);
        setErrorMessage('Failed to refresh dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    refreshData();

    // Set up interval for real-time updates
    const interval = setInterval(refreshData, 5000);

    return () => {
      clearInterval(interval);
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [updatePlayers, updateTournaments]);

  const refreshData = () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      // Refresh players from storage
      const currentPlayers = getFromStorage('players', []);
      updatePlayers(currentPlayers);

      // Refresh tournaments from storage
      const currentTournaments = getFromStorage('tournaments', []);
      updateTournaments(currentTournaments);

      // Refresh organizers
      const organizers = getFromStorage('users', []);
      const pending = organizers.filter((user: User) => 
        user.role === 'tournament_organizer' && user.status === 'pending'
      );
      setPendingOrganizers(pending);

      console.log("🔄 Manual dashboard refresh completed");

    } catch (error) {
      console.error('Error in manual refresh:', error);
      setHasError(true);
      setErrorMessage('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pendingTournaments,
    completedTournaments,
    pendingPlayers,
    pendingOrganizers,
    isLoading: isLoading || storageLoading,
    hasError,
    errorMessage,
    refreshData,
    dataTimeoutRef
  };
};
