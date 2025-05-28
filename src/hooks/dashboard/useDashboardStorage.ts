
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client"; // Added Supabase client
import { Tournament, Player, User } from "@/lib/mockData";

interface DashboardData {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: Player[];
  pendingOrganizers: User[];
}

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
        supabase.from("users").select("*").eq("role", "tournament_organizer").eq("status", "pending"),
      ]);

      // Clear timeout on successful load attempt (before error checking)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null; // Important to nullify after clearing
      }

      // Check for errors in fetched data
      if (pendingTournamentsResult.error) throw pendingTournamentsResult.error;
      if (completedTournamentsResult.error) throw completedTournamentsResult.error;
      if (pendingPlayersResult.error) throw pendingPlayersResult.error;
      if (pendingOrganizersResult.error) throw pendingOrganizersResult.error;

      const fetchedData: DashboardData = {
        pendingTournaments: pendingTournamentsResult.data as Tournament[],
        completedTournaments: completedTournamentsResult.data as Tournament[],
        pendingPlayers: pendingPlayersResult.data as Player[],
        pendingOrganizers: pendingOrganizersResult.data as User[],
      };

      setData(fetchedData);
      setHasError(false); // Explicitly set no error on success
      setErrorMessage(null); // Clear any previous error message

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
