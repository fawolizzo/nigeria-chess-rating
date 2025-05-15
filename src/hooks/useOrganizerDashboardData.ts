
import { useState, useEffect, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useToast } from "@/hooks/use-toast";
import { format, isValid } from "date-fns";
import { TournamentFormData } from "@/types/tournamentTypes";

export function useOrganizerDashboardData(userId: string | undefined) {
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load tournaments
  const loadTournaments = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      setTournaments([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      logMessage(LogLevel.INFO, 'useOrganizerDashboardData', 'Loading tournaments', { userId });
      
      // Get tournaments from localStorage
      const tournamentsJSON = localStorage.getItem('ncr_tournaments');
      
      if (!tournamentsJSON) {
        setTournaments([]);
        setIsLoading(false);
        return;
      }
      
      const allTournaments = JSON.parse(tournamentsJSON);
      
      // Filter for organizer's tournaments
      const organizerTournaments = Array.isArray(allTournaments) 
        ? allTournaments.filter((t: any) => t && t.organizer_id === userId)
        : [];
      
      logMessage(LogLevel.INFO, 'useOrganizerDashboardData', 
        `Found ${organizerTournaments.length} tournaments for organizer`, { userId });
      
      setTournaments(organizerTournaments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logMessage(LogLevel.ERROR, 'useOrganizerDashboardData', 'Error loading tournaments', { error: errorMessage });
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

  // Create new tournament
  const createTournament = useCallback((data: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean) => {
    try {
      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in to create a tournament",
          variant: "destructive"
        });
        return false;
      }

      // Get existing tournaments
      const tournamentsJSON = localStorage.getItem('ncr_tournaments') || '[]';
      const existingTournaments = JSON.parse(tournamentsJSON);

      // Generate new tournament object
      const newTournament = {
        id: crypto.randomUUID(),
        organizer_id: userId,
        name: data.name,
        description: data.description || '',
        location: data.venue,
        city: data.city,
        state: data.state,
        start_date: data.startDate,
        end_date: data.endDate,
        time_control: isCustomTimeControl ? customTimeControl : data.timeControl,
        rounds: parseInt(data.rounds.toString()),
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Add to tournaments array
      const updatedTournaments = [...existingTournaments, newTournament];
      localStorage.setItem('ncr_tournaments', JSON.stringify(updatedTournaments));

      // Update state
      setTournaments(prev => [...prev, newTournament]);
      
      toast({
        title: "Tournament Created",
        description: "Your tournament has been submitted for approval",
      });
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logMessage(LogLevel.ERROR, 'useOrganizerDashboardData', 'Error creating tournament', { error: errorMessage });
      
      toast({
        title: "Error Creating Tournament",
        description: "There was a problem creating your tournament. Please try again.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [userId, toast]);

  // Filter tournaments by status
  const filterTournamentsByStatus = useCallback((status: string) => {
    return tournaments.filter(t => t.status === status) || [];
  }, [tournaments]);

  // Format display date with improved timezone handling
  const formatDisplayDate = useCallback((dateString: string | undefined | null) => {
    if (!dateString) return 'N/A';
    
    try {
      // For YYYY-MM-DD format - create date in local timezone without UTC conversion
      const dateParts = dateString.split('-');
      if (dateParts.length === 3) {
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10) - 1; // Month is 0-indexed in JS
        const day = parseInt(dateParts[2], 10);
        
        const date = new Date(year, month, day);
        if (isValid(date)) {
          return format(date, 'MMM dd, yyyy');
        }
      }
      
      // Fallback for other date formats
      const date = new Date(dateString);
      if (isValid(date)) {
        return format(date, 'MMM dd, yyyy');
      }
      
      return 'N/A';
    } catch (error) {
      return 'N/A';
    }
  }, []);

  // Get next upcoming tournament
  const getNextTournament = useCallback(() => {
    if (!tournaments || tournaments.length === 0) {
      return undefined;
    }
    
    try {
      // Filter for approved tournaments with start dates
      const validTournaments = tournaments.filter(t => 
        t.status === 'approved' && t.start_date
      );
      
      if (validTournaments.length === 0) {
        return undefined;
      }
      
      // Sort by start date
      const sortedTournaments = [...validTournaments].sort((a, b) => {
        const parseLocalDate = (dateStr: string) => {
          const parts = dateStr.split('-');
          if (parts.length === 3) {
            return new Date(
              parseInt(parts[0], 10),
              parseInt(parts[1], 10) - 1,
              parseInt(parts[2], 10)
            );
          }
          return new Date(dateStr);
        };
        
        const dateA = parseLocalDate(a.start_date);
        const dateB = parseLocalDate(b.start_date);
        
        if (!isValid(dateA) && !isValid(dateB)) return 0;
        if (!isValid(dateA)) return 1;
        if (!isValid(dateB)) return -1;
        
        return dateA.getTime() - dateB.getTime();
      });
      
      return sortedTournaments[0];
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOrganizerDashboardData', 'Error finding next tournament', { error });
      return undefined;
    }
  }, [tournaments]);

  // Load tournaments on mount and when userId changes
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
