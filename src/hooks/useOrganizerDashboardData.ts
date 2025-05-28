
import { useState, useEffect } from "react";
import { Tournament } from "@/lib/mockData";
import { getTournamentsFromSupabase } from "@/services/tournamentService";
import { useToast } from "@/hooks/use-toast";

export const useOrganizerDashboardData = (organizerId?: string) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTournaments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const allTournaments = await getTournamentsFromSupabase();
      
      // Filter by organizer if provided
      const filteredTournaments = organizerId 
        ? allTournaments.filter(t => t.organizerId === organizerId)
        : allTournaments;
      
      setTournaments(filteredTournaments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tournaments';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, [organizerId]);

  const createTournament = async (tournamentData: Omit<Tournament, "id" | "createdAt" | "updatedAt">) => {
    try {
      // Convert Tournament data to database format
      const dbTournamentData = {
        name: tournamentData.name,
        description: tournamentData.description,
        startDate: tournamentData.startDate,
        endDate: tournamentData.endDate,
        location: tournamentData.location,
        city: tournamentData.city,
        state: tournamentData.state,
        timeControl: tournamentData.timeControl,
        rounds: tournamentData.rounds,
        organizerId: tournamentData.organizerId,
        status: tournamentData.status || 'pending',
        registrationOpen: tournamentData.registrationOpen
      };

      const { createTournamentInSupabase } = await import("@/services/tournamentService");
      const newTournament = await createTournamentInSupabase(dbTournamentData);
      
      if (newTournament) {
        setTournaments(prev => [newTournament, ...prev]);
        toast({
          title: "Success",
          description: "Tournament created successfully"
        });
        return newTournament;
      }
      throw new Error("Failed to create tournament");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create tournament';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const updateTournament = async (tournamentId: string, updates: Partial<Tournament>) => {
    try {
      const { updateTournamentInSupabase } = await import("@/services/tournamentService");
      const updatedTournament = await updateTournamentInSupabase(tournamentId, updates);
      
      if (updatedTournament) {
        setTournaments(prev =>
          prev.map(t => t.id === tournamentId ? updatedTournament : t)
        );
        return updatedTournament;
      }
      throw new Error("Failed to update tournament");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update tournament';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      throw err;
    }
  };

  const getTournamentsByStatus = (status: string) => {
    return tournaments.filter(tournament => {
      if (status === 'upcoming') {
        return tournament.status === 'approved' && new Date(tournament.startDate) > new Date();
      }
      if (status === 'ongoing') {
        const now = new Date();
        return tournament.status === 'approved' && 
               new Date(tournament.startDate) <= now && 
               new Date(tournament.endDate) >= now;
      }
      return tournament.status === status;
    });
  };

  return {
    tournaments,
    isLoading,
    error,
    fetchTournaments,
    createTournament,
    updateTournament,
    getTournamentsByStatus
  };
};
