import { useState, useEffect, useRef } from 'react';
import { Tournament, Player } from '@/lib/mockData';
import { User } from '@/types/userTypes';
import { useDashboardStorage } from './useDashboardStorage';
import { getFromStorageSync } from '../../utils/storageUtils';
import { syncPlayersToLocalStorage } from '@/services/player/playerCoreService';

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
  const {
    tournaments,
    isLoading: storageLoading,
    updateTournaments,
  } = useDashboardStorage();
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
    pendingOrganizersCount: pendingOrganizers.length,
  });

  // Filter tournaments by status
  const pendingTournaments = tournaments.filter((t) => t.status === 'pending');
  const completedTournaments = tournaments.filter(
    (t) => t.status === 'completed' || t.status === 'approved'
  );

  // Filter players by status
  const pendingPlayers = players.filter((p) => p.status === 'pending');

  // Consolidated data loading and refresh logic
  const loadDashboardData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        console.log('📥 Loading initial data from storage...');
        setIsLoading(true);
      } else {
        console.log('🔄 Refreshing dashboard data...');
        // Don't set isLoading to true during refresh to prevent blinking
      }

      setHasError(false);
      setErrorMessage(null);

      // Add timeout to prevent getting stuck in loading state
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Data loading timeout')), 10000); // 10 second timeout
      });

      // Sync players from Supabase to localStorage with timeout
      await Promise.race([syncPlayersToLocalStorage(), timeoutPromise]);

      // Load players from storage
      const currentPlayers = getFromStorageSync('players', []);
      console.log('📊 Loaded players from storage:', currentPlayers.length);
      setPlayers(Array.isArray(currentPlayers) ? currentPlayers : []);

      // Load organizers from storage
      const organizers = getFromStorageSync('users', []);
      console.log('📊 Loaded organizers from storage:', organizers.length);
      const pending = organizers.filter(
        (user: User) =>
          user.role === 'tournament_organizer' && user.status === 'pending'
      );
      setPendingOrganizers(pending);
      console.log('📊 Pending organizers found:', pending.length);

      // Refresh tournaments from storage
      const currentTournaments = getFromStorageSync('tournaments', []);
      console.log('📊 Refreshed tournaments:', currentTournaments.length);
      updateTournaments(currentTournaments);

      console.log('✅ Dashboard data loaded successfully:', {
        players: currentPlayers.length,
        tournaments: currentTournaments.length,
        pendingOrganizers: pending.length,
      });
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setHasError(true);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load dashboard data'
      );
      setPlayers([]);
      setPendingOrganizers([]);
    } finally {
      if (isInitialLoad) {
        setIsLoading(false);
      }
    }
  };

  // Initial data load
  useEffect(() => {
    loadDashboardData(true);
  }, []);

  // Set up real-time data refresh
  useEffect(() => {
    console.log('🔄 Setting up data refresh...');

    // Set up interval for real-time updates
    const interval = setInterval(() => loadDashboardData(false), 5000);

    return () => {
      clearInterval(interval);
      if (dataTimeoutRef.current) {
        clearTimeout(dataTimeoutRef.current);
      }
    };
  }, [updateTournaments]);

  const refreshData = async () => {
    console.log('🔄 Manual refresh triggered');
    await loadDashboardData(false);
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
    dataTimeoutRef,
  };

  console.log('📤 useOfficerDashboardData returning:', {
    pendingTournaments: result.pendingTournaments.length,
    completedTournaments: result.completedTournaments.length,
    pendingPlayers: result.pendingPlayers.length,
    pendingOrganizers: result.pendingOrganizers.length,
    isLoading: result.isLoading,
    hasError: result.hasError,
  });

  return result;
};
