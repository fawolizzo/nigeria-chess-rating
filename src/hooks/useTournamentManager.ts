
import { useState, useCallback, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { Tournament, TournamentFormValues } from "@/types/tournamentTypes";
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
      const storedTournaments = localStorage.getItem('ncr_tournaments');
      if (storedTournaments) {
        const parsedTournaments: Tournament[] = JSON.parse(storedTournaments);
        setTournaments(parsedTournaments.filter(t => t.organizerId === currentUser?.id));
        logMessage(LogLevel.INFO, 'useTournamentManager', 'Tournaments loaded from localStorage', { count: parsedTournaments.length });
      } else {
        setTournaments([]);
        logMessage(LogLevel.INFO, 'useTournamentManager', 'No tournaments found in localStorage');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setLoadError(`Failed to load tournaments: ${errorMessage}`);
      logMessage(LogLevel.ERROR, 'useTournamentManager', 'Error loading tournaments from localStorage', error);
    } finally {
      setIsLoading(false);
    }

    return tournaments;
  }, [currentUser?.id, tournaments]);

  const createTournament = useCallback(
    (
      tournamentData: TournamentFormValues,
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
        startDate: format(tournamentData.startDate, 'yyyy-MM-dd'),
        endDate: format(tournamentData.endDate, 'yyyy-MM-dd'),
        venue: tournamentData.location,
        state: tournamentData.state,
        city: tournamentData.city,
        rounds: tournamentData.rounds,
        timeControl: isCustomTimeControl ? customTimeControl : tournamentData.timeControl,
        organizerId: currentUser.id,
        registrationOpen: true,
        status: 'upcoming', // Changed from 'draft' to 'upcoming' to match allowed statuses
        createdAt: new Date().toISOString(),
        lastModified: Date.now(),
        pairings: [],
        players: []
      };

      try {
        const existingTournaments = localStorage.getItem('ncr_tournaments');
        const tournamentsArray = existingTournaments ? JSON.parse(existingTournaments) : [];
        tournamentsArray.push(newTournament);
        localStorage.setItem('ncr_tournaments', JSON.stringify(tournamentsArray));
        setTournaments(tournamentsArray.filter(t => t.organizerId === currentUser?.id));

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

export type { TournamentFormValues };
