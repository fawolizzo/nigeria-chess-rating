
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tournament, Player, User } from "@/lib/mockData";

interface DashboardData {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: Player[];
  pendingOrganizers: User[];
}

// Map database tournament to application Tournament type
const mapDatabaseTournament = (dbTournament: any): Tournament => {
  return {
    id: dbTournament.id,
    name: dbTournament.name,
    description: dbTournament.description || '',
    startDate: dbTournament.start_date,
    endDate: dbTournament.end_date,
    location: dbTournament.location,
    city: dbTournament.city,
    state: dbTournament.state,
    organizerId: dbTournament.organizer_id,
    status: dbTournament.status,
    rounds: dbTournament.rounds,
    currentRound: dbTournament.current_round || 1,
    category: 'classical' as const,
    timeControl: dbTournament.time_control,
    participants: dbTournament.participants || 0,
    registrationOpen: dbTournament.registration_open || false,
    players: [],
    pairings: [],
    standings: [],
    createdAt: dbTournament.created_at,
    updatedAt: dbTournament.updated_at
  };
};

// Map database player to application Player type
const mapDatabasePlayer = (dbPlayer: any): Player => {
  return {
    id: dbPlayer.id,
    name: dbPlayer.name,
    rating: dbPlayer.rating || 800,
    gender: (dbPlayer.gender as "M" | "F") || 'M',
    state: dbPlayer.state || '',
    city: dbPlayer.city || '',
    country: 'Nigeria',
    status: (dbPlayer.status as "pending" | "approved" | "rejected") || 'approved',
    gamesPlayed: dbPlayer.games_played || 0,
    phone: dbPlayer.phone || '',
    email: dbPlayer.email || '',
    ratingHistory: [],
    tournamentResults: [],
    rapidRating: 800,
    blitzRating: 800,
    rapidGamesPlayed: 0,
    blitzGamesPlayed: 0,
    ratingStatus: 'provisional' as const,
    rapidRatingStatus: 'provisional' as const,
    blitzRatingStatus: 'provisional' as const
  };
};

export const useDashboardStorage = () => {
  const [data, setData] = useState<DashboardData>({
    pendingTournaments: [],
    completedTournaments: [],
    pendingPlayers: [],
    pendingOrganizers: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      setHasError(false);
      setErrorMessage(null);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set a timeout to prevent infinite loading
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setHasError(true);
        setErrorMessage("Dashboard data loading timed out");
      }, 10000);

      // Fetch data from Supabase
      const [
        pendingTournamentsResult,
        completedTournamentsResult,
        pendingPlayersResult,
        pendingOrganizersResult,
      ] = await Promise.all([
        supabase.from("tournaments").select("*").eq("status", "pending"),
        supabase.from("tournaments").select("*").or("status.eq.completed,status.eq.processed"),
        supabase.from("players").select("*").eq("status", "pending"),
        supabase.from("organizers").select("*").eq("status", "pending"),
      ]);

      // Clear timeout on successful load attempt (before error checking)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Check for errors in fetched data
      if (pendingTournamentsResult.error) throw pendingTournamentsResult.error;
      if (completedTournamentsResult.error) throw completedTournamentsResult.error;
      if (pendingPlayersResult.error) throw pendingPlayersResult.error;
      if (pendingOrganizersResult.error) throw pendingOrganizersResult.error;

      const fetchedData: DashboardData = {
        pendingTournaments: (pendingTournamentsResult.data || []).map(mapDatabaseTournament),
        completedTournaments: (completedTournamentsResult.data || []).map(mapDatabaseTournament),
        pendingPlayers: (pendingPlayersResult.data || []).map(mapDatabasePlayer),
        pendingOrganizers: (pendingOrganizersResult.data || []).map(organizer => ({
          id: organizer.id,
          email: organizer.email,
          fullName: organizer.name,
          role: organizer.role,
          status: organizer.status,
          phone: organizer.phone || '',
          registrationDate: organizer.created_at
        }))
      };

      setData(fetchedData);
      setHasError(false);
      setErrorMessage(null);

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setHasError(true);
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setErrorMessage(String((error as { message: string }).message));
      } else {
        setErrorMessage("An unknown error occurred while fetching dashboard data.");
      }
      // Ensure timeout is cleared if an error occurs during fetch (after initial timeout setup)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const refreshData = () => {
    loadDashboardData();
  };

  return {
    ...data,
    isLoading,
    hasError,
    errorMessage,
    refreshData,
    dataTimeoutRef: timeoutRef
  };
};
