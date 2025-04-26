
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { Tournament, TournamentFormData } from "@/types/tournamentTypes";
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function useTournamentManager() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { currentUser } = useUser();
  const { toast } = useToast();

  const loadTournaments = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      logMessage(LogLevel.INFO, 'useTournamentManager', 'Loading tournaments', {
        userId: currentUser?.id
      });
      
      if (!currentUser?.id) {
        logMessage(LogLevel.WARNING, 'useTournamentManager', 'No current user ID, cannot load tournaments');
        setTournaments([]);
        return [];
      }

      const storedTournaments = localStorage.getItem('ncr_tournaments');
      if (storedTournaments) {
        const parsedTournaments: Tournament[] = JSON.parse(storedTournaments);
        const userTournaments = parsedTournaments.filter(t => t.organizer_id === currentUser?.id);
        setTournaments(userTournaments);
        
        logMessage(LogLevel.INFO, 'useTournamentManager', 'Tournaments loaded from localStorage', { 
          total: parsedTournaments.length,
          userTournaments: userTournaments.length,
          userId: currentUser?.id
        });
        
        return userTournaments;
      } else {
        setTournaments([]);
        logMessage(LogLevel.INFO, 'useTournamentManager', 'No tournaments found in localStorage');
        return [];
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoadError(`Failed to load tournaments: ${errorMessage}`);
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error loading tournaments from localStorage', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id]);

  const createTournament = useCallback(
    (
      tournamentData: TournamentFormData,
      customTimeControl: string,
      isCustomTimeControl: boolean
    ): boolean => {
      if (!currentUser) {
        toast({
          title: "Not Authenticated",
          description: "You must be logged in to create a tournament.",
          variant: "destructive",
        });
        logMessage(LogLevel.ERROR, 'useTournamentManager', 'User not authenticated, cannot create tournament');
        return false;
      }

      const newTournament: Tournament = {
        id: uuidv4(),
        name: tournamentData.name,
        description: tournamentData.description,
        start_date: format(tournamentData.startDate, 'yyyy-MM-dd'),
        end_date: format(tournamentData.endDate, 'yyyy-MM-dd'),
        location: tournamentData.location,
        city: tournamentData.city,
        state: tournamentData.state,
        rounds: tournamentData.rounds,
        time_control: isCustomTimeControl ? customTimeControl : tournamentData.timeControl,
        organizer_id: currentUser.id,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const existingTournaments = localStorage.getItem('ncr_tournaments');
        const tournamentsArray = existingTournaments ? JSON.parse(existingTournaments) : [];
        tournamentsArray.push(newTournament);
        localStorage.setItem('ncr_tournaments', JSON.stringify(tournamentsArray));
        
        // Update local state with user's tournaments only
        const userTournaments = tournamentsArray.filter(t => t.organizer_id === currentUser?.id);
        setTournaments(userTournaments);

        toast({
          title: "Tournament Created",
          description: "Your tournament has been created successfully.",
        });
        logMessage(LogLevel.INFO, 'useTournamentManager', 'Tournament created successfully', { tournamentId: newTournament.id });
        return true;
      } catch (error) {
        toast({
          title: "Failed to Create Tournament",
          description: "There was an error creating the tournament.",
          variant: "destructive",
        });
        logMessage(LogLevel.ERROR, 'useTournamentManager', 'Failed to create tournament', error);
        return false;
      }
    },
    [currentUser, toast]
  );

  const retry = useCallback(() => {
    loadTournaments();
  }, [loadTournaments]);

  useEffect(() => {
    if (currentUser) {
      loadTournaments();
    }
  }, [currentUser, loadTournaments]);

  return {
    tournaments,
    isLoading,
    loadError,
    createTournament,
    loadTournaments,
    retry
  };
}

// Re-export the type for backward compatibility
export type { TournamentFormData as TournamentFormValues };
