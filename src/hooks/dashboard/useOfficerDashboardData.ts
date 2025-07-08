import { useState, useEffect, useRef } from "react";
import { Tournament, Player } from "@/lib/mockData";
import { User } from '@/types/userTypes';
import { useDashboardStorage } from "./useDashboardStorage";
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

  // Consolidated data loading and refresh logic using Supabase directly
  const loadDashboardData = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        console.log('📥 Loading initial data from Supabase...');
        setIsLoading(true);
      } else {
        console.log('🔄 Refreshing dashboard data from Supabase...');
      }
      
      setHasError(false);
      setErrorMessage(null);

      // Import required services
      const { getAllPlayersFromSupabase } = await import('../../services/player/playerQueryService');
      const { supabase } = await import('../../integrations/supabase/client');

      // Load players directly from Supabase
      try {
        console.log('🔄 Fetching players from Supabase...');
        const supabasePlayers = await getAllPlayersFromSupabase();
        console.log('📊 Loaded players from Supabase:', supabasePlayers.length);
        setPlayers(Array.isArray(supabasePlayers) ? supabasePlayers : []);
      } catch (playerError) {
        console.error('❌ Error loading players from Supabase:', playerError);
        setPlayers([]);
      }

      // Load organizers from Supabase
      try {
        console.log('🔄 Fetching organizers from Supabase...');
        const { data: organizers, error: orgError } = await supabase
          .from('organizers')
          .select('*');
          
        if (orgError) {
          console.error('❌ Error loading organizers:', orgError);
          setPendingOrganizers([]);
        } else {
          const supabaseOrganizers = Array.isArray(organizers) ? organizers : [];
          const pending = supabaseOrganizers
            .filter(org => org.status === 'pending')
            .map(org => ({
              id: org.id,
              email: org.email,
              fullName: org.name,
              phoneNumber: org.phone || '',
              state: '',
              role: 'tournament_organizer' as const,
              status: org.status as 'pending' | 'approved' | 'rejected',
              registrationDate: org.created_at,
              lastModified: Date.now()
            }));
          
          console.log('📊 Pending organizers found:', pending.length);
          setPendingOrganizers(pending);
        }
      } catch (orgError) {
        console.error('❌ Error loading organizers:', orgError);
        setPendingOrganizers([]);
      }

      // Load tournaments from Supabase
      try {
        console.log('🔄 Fetching tournaments from Supabase...');
        const { data: tournaments, error: tournError } = await supabase
          .from('tournaments')
          .select('*');
          
        if (tournError) {
          console.error('❌ Error loading tournaments:', tournError);
          updateTournaments([]);
        } else {
          const supabaseTournaments = Array.isArray(tournaments) ? tournaments : [];
          console.log('📊 Loaded tournaments from Supabase:', supabaseTournaments.length);
          
          // Transform to match expected Tournament interface
          const transformedTournaments = supabaseTournaments.map(t => ({
            id: t.id,
            name: t.name,
            state: t.state,
            city: t.city,
            location: t.location,
            startDate: t.start_date,
            endDate: t.end_date,
            start_date: t.start_date, // Keep both formats for compatibility
            end_date: t.end_date,
            rounds: t.rounds,
            status: t.status as "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed",
            timeControl: t.time_control,
            time_control: t.time_control, // Keep both formats for compatibility
            description: t.description || '',
            created_at: t.created_at,
            updated_at: t.updated_at,
            current_round: t.current_round || 1,
            participants: t.participants || 0,
            registration_open: t.registration_open || true,
            organizer_id: t.organizer_id,
            pairings: [],
            results: [],
            standings: []
          }));
          
          updateTournaments(transformedTournaments);
        }
      } catch (tournError) {
        console.error('❌ Error loading tournaments:', tournError);
        updateTournaments([]);
      }

      console.log("✅ Dashboard data loaded successfully from Supabase");

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard data');
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
