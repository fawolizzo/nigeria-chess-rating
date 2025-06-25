import { useState, useEffect, useRef } from "react";
import { Tournament, Player } from "@/lib/mockData";
import { User } from '@/types/userTypes';
import { useDashboardStorage } from "./useDashboardStorage";
import { getFromStorageSync } from '@/utils/storageUtils';

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
  const { tournaments, isLoading: storageLoading, updateTournaments } = useDashboardStorage();
  const [players, setPlayers] = useState<Player[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  console.log('🔄 useOfficerDashboardData hook called:', {
    tournamentsCount: tournaments.length,
    storageLoading,
    playersCount: players.length,
    hasError,
    errorMessage,
    isLoading,
    pendingOrganizersCount: pendingOrganizers.length
  });

  // Filter tournaments by status
  const pendingTournaments = tournaments.filter(t => t.status === "pending");
  const completedTournaments = tournaments.filter(t => t.status === "completed" || t.status === "approved");
  
  // Filter players by status
  const pendingPlayers = players.filter(p => p.status === "pending");

  // Load players and organizers from storage with error handling
  useEffect(() => {
    console.log('📥 Loading initial data from storage...');
    const loadData = () => {
      try {
        // Load players from storage
        const storedPlayers = getFromStorageSync('players', []);
        console.log('📊 Loaded players from storage:', storedPlayers.length);
        setPlayers(Array.isArray(storedPlayers) ? storedPlayers : []);

        // Load organizers from storage
        const organizers = getFromStorageSync('users', []);
        console.log('📊 Loaded organizers from storage:', organizers.length);
        const pending = organizers.filter((user: User) => 
          user.role === 'tournament_organizer' && user.status === 'pending'
        );
        setPendingOrganizers(pending);
        console.log('📊 Pending organizers found:', pending.length);
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        setPlayers([]);
        setPendingOrganizers([]);
      }
    };

    loadData();
  }, []);

  // Set up real-time data refresh
  useEffect(() => {
    console.log('🔄 Setting up data refresh...');
    const refreshData = () => {
      try {
        console.log('🔄 Refreshing dashboard data...');
        setIsLoading(true);
        setHasError(false);
        setErrorMessage(null);

        // Refresh players from storage
        const currentPlayers = getFromStorageSync('players', []);
        console.log('📊 Refreshed players:', currentPlayers.length);
        setPlayers(Array.isArray(currentPlayers) ? currentPlayers : []);

        // Refresh tournaments from storage
        const currentTournaments = getFromStorageSync('tournaments', []);
        console.log('📊 Refreshed tournaments:', currentTournaments.length);
        updateTournaments(currentTournaments);

        // Refresh organizers
        const organizers = getFromStorageSync('users', []);
        const pending = organizers.filter((user: User) => 
          user.role === 'tournament_organizer' && user.status === 'pending'
        );
        setPendingOrganizers(pending);
        console.log('📊 Refreshed pending organizers:', pending.length);

        console.log("🔄 Dashboard data refreshed successfully:", {
          players: currentPlayers.length,
          tournaments: currentTournaments.length,
          pendingOrganizers: pending.length
        });

      } catch (error) {
        console.error('❌ Error refreshing dashboard data:', error);
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
  }, [updateTournaments]);

  const refreshData = () => {
    try {
      console.log('🔄 Manual refresh triggered');
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      // Refresh players from storage
      const currentPlayers = getFromStorageSync('players', []);
      setPlayers(Array.isArray(currentPlayers) ? currentPlayers : []);

      // Refresh tournaments from storage
      const currentTournaments = getFromStorageSync('tournaments', []);
      updateTournaments(currentTournaments);

      // Refresh organizers
      const organizers = getFromStorageSync('users', []);
      const pending = organizers.filter((user: User) => 
        user.role === 'tournament_organizer' && user.status === 'pending'
      );
      setPendingOrganizers(pending);

      console.log("🔄 Manual dashboard refresh completed");

    } catch (error) {
      console.error('❌ Error in manual refresh:', error);
      setHasError(true);
      setErrorMessage('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };

  const result = {
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

  console.log('📤 useOfficerDashboardData returning:', {
    pendingTournaments: result.pendingTournaments.length,
    completedTournaments: result.completedTournaments.length,
    pendingPlayers: result.pendingPlayers.length,
    pendingOrganizers: result.pendingOrganizers.length,
    isLoading: result.isLoading,
    hasError: result.hasError
  });

  return result;
};
