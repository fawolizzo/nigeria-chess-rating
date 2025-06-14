
import { useState, useEffect } from "react";
import { Tournament } from "@/lib/mockData";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { getTournamentsFromSupabase, createTournamentInSupabase, updateTournamentInSupabase } from "@/services/tournamentService";

export const useOrganizerDashboardData = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useUser();
  const { toast } = useToast();

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      const allTournaments = await getTournamentsFromSupabase();
      
      // Filter tournaments for current organizer
      const organizerTournaments = currentUser 
        ? allTournaments.filter(t => t.organizer_id === currentUser.id)
        : [];
      
      setTournaments(organizerTournaments);
    } catch (error) {
      console.error("Error loading tournaments:", error);
      toast({
        title: "Error",
        description: "Failed to load tournaments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadTournaments();
    }
  }, [currentUser]);

  const createTournament = async (tournamentData: any) => {
    try {
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const newTournament = await createTournamentInSupabase({
        ...tournamentData,
        organizer_id: currentUser.id,
      });

      await loadTournaments(); // Reload tournaments
      return newTournament;
    } catch (error) {
      console.error("Error creating tournament:", error);
      throw error;
    }
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>) => {
    try {
      const updatedTournament = await updateTournamentInSupabase(id, updates);
      await loadTournaments(); // Reload tournaments
      return updatedTournament;
    } catch (error) {
      console.error("Error updating tournament:", error);
      throw error;
    }
  };

  const filterTournamentsByStatus = (status: string) => {
    return tournaments.filter(tournament => {
      if (status === "all") return true;
      if (status === "upcoming") return tournament.status === "approved" && new Date(tournament.start_date) > new Date();
      return tournament.status === status;
    });
  };

  const refreshData = () => {
    loadTournaments();
  };

  return {
    tournaments,
    isLoading,
    createTournament,
    updateTournament,
    filterTournamentsByStatus,
    refreshData,
  };
};
