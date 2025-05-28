
import { useState, useEffect, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, parseISO } from "date-fns"; // Added parseISO
import { TournamentFormData, TournamentFormValues } from "@/types/tournamentTypes"; // Ensure TournamentFormValues is imported if used
import { Tournament } from "@/lib/mockData"; // Import Tournament type
import { getTournamentsFromSupabase, createTournamentInSupabase } from "@/services/tournamentService"; // Supabase services

export function useOrganizerDashboardData(userId: string | undefined) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]); // Use Tournament type
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load tournaments from Supabase
  const loadTournaments = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setTournaments([]);
      logMessage(LogLevel.WARNING, 'useOrganizerDashboardData', 'User ID is undefined, cannot load tournaments.');
      return;
    }

    setIsLoading(true);
    setError(null);
    logMessage(LogLevel.INFO, 'useOrganizerDashboardData', 'Loading tournaments from Supabase', { userId });

    try {
      // Fetch tournaments filtered by organizerId
      const organizerTournaments = await getTournamentsFromSupabase({ organizerId: userId });
      
      logMessage(LogLevel.INFO, 'useOrganizerDashboardData', 
        `Found ${organizerTournaments.length} tournaments for organizer`, { userId });
      
      setTournaments(organizerTournaments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logMessage(LogLevel.ERROR, 'useOrganizerDashboardData', 'Error loading tournaments from Supabase', { error: errorMessage });
      setError(`Failed to load tournaments: ${errorMessage}`);
      
      toast({
        title: "Error Loading Data",
        description: "There was a problem loading your tournaments. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  // Create new tournament in Supabase
  const createTournament = useCallback(async (data: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean): Promise<boolean> => {
    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a tournament.",
        variant: "destructive"
      });
      return false;
    }
    setIsLoading(true); // Indicate processing
    try {
      const tournamentToCreate: Omit<Tournament, 'id'> = {
        organizerId: userId,
        name: data.name,
        description: data.description || '',
        location: data.location,
        city: data.city,
        state: data.state,
        // Ensure dates are in 'YYYY-MM-DD' string format for Supabase if columns are `date` type
        startDate: format(data.startDate, 'yyyy-MM-dd'), 
        endDate: format(data.endDate, 'yyyy-MM-dd'),
        timeControl: isCustomTimeControl ? customTimeControl : data.timeControl,
        rounds: typeof data.rounds === 'string' ? parseInt(data.rounds, 10) : data.rounds,
        status: 'pending', // Default status for new tournaments
        // category, players, pairings, etc., can be added later or set to defaults if needed
      };

      const newTournament = await createTournamentInSupabase(tournamentToCreate);

      if (newTournament) {
        setTournaments(prev => [...prev, newTournament]);
        toast({
          title: "Tournament Created",
          description: "Your tournament has been submitted for approval.",
        });
        setIsLoading(false);
        return true;
      } else {
        throw new Error("Tournament creation failed in Supabase service.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logMessage(LogLevel.ERROR, 'useOrganizerDashboardData', 'Error creating tournament in Supabase', { error: errorMessage });
      setError(`Failed to create tournament: ${errorMessage}`);
      toast({
        title: "Error Creating Tournament",
        description: "There was a problem creating your tournament. Please try again.",
        variant: "destructive"
      });
      setIsLoading(false);
      return false;
    }
  }, [userId, toast]);

  // Filter tournaments by status
  const filterTournamentsByStatus = useCallback((status: Tournament['status']) => { // Use type for status
    return tournaments.filter(t => t.status === status);
  }, [tournaments]);

  // Format display date with improved timezone handling
  const formatDisplayDate = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    try {
      // Supabase often returns ISO strings (e.g., "2024-07-15T00:00:00Z" or "2024-07-15")
      // parseISO handles these robustly.
      const date = parseISO(dateString); 
      if (isValid(date)) {
        return format(date, 'MMM dd, yyyy');
      }
      // Fallback for potentially non-ISO simple "YYYY-MM-DD" strings (though parseISO often handles these)
      const dateParts = dateString.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1;
        const day = parseInt(dateParts[2], 10);
        const localDate = new Date(year, month, day);
        if (isValid(localDate)) {
          return format(localDate, 'MMM dd, yyyy');
        }
      }
      return 'Invalid Date';
    } catch (error) {
      logMessage(LogLevel.ERROR, 'formatDisplayDate', 'Error formatting date', { dateString, error });
      return 'N/A';
    }
  }, []);

  // Get next upcoming tournament
  const getNextTournament = useCallback(() => {
    if (!tournaments || tournaments.length === 0) {
      return undefined;
    }
    
    try {
      const upcomingApprovedTournaments = tournaments.filter(t => 
        (t.status === 'approved' || t.status === 'upcoming') && // Consider both 'approved' and 'upcoming'
        t.startDate && isValid(parseISO(t.startDate))
      );
      
      if (upcomingApprovedTournaments.length === 0) {
        return undefined;
      }
      
      const sortedTournaments = [...upcomingApprovedTournaments].sort((a, b) => {
        const dateA = parseISO(a.startDate);
        const dateB = parseISO(b.startDate);
        return dateA.getTime() - dateB.getTime();
      });
      
      return sortedTournaments[0];
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOrganizerDashboardData', 'Error finding next tournament', { error });
      return undefined;
    }
  }, [tournaments]);

  // Load tournaments on mount and when userId changes
  // Ensure loadTournaments is stable or correctly memoized if passed in dependency array
  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  return {
    tournaments,
    isLoading,
    error,
    loadTournaments,
    createTournament,
    filterTournamentsByStatus,
    formatDisplayDate,
    getNextTournament
  };
}
