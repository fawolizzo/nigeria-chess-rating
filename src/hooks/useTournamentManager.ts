
import { useState, useEffect } from "react";
import { Tournament, Player } from "@/lib/mockData";
import { TournamentFormData } from "@/components/tournament/form/TournamentFormSchema";
import { useToast } from "@/hooks/use-toast";

export interface TournamentManagerHook {
  tournaments: Tournament[];
  isLoading: boolean;
  loadError: string;
  createTournament: (tournamentData: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean) => boolean;
  loadTournaments: () => Promise<void>;
  retry: () => void;
  generatePairings: (tournamentId: string) => Promise<void>;
  recordResult: (tournamentId: string, pairingId: string, result: string) => Promise<void>;
  addPlayerToTournament: (tournamentId: string, players: Player[]) => Promise<void>;
  removePlayerFromTournament: (tournamentId: string, playerId: string) => Promise<void>;
  toggleRegistration: (tournamentId: string) => Promise<void>;
  startTournament: (tournamentId: string) => Promise<void>;
  completeTournament: (tournamentId: string) => Promise<void>;
  nextRound: (tournamentId: string) => Promise<void>;
}

export const useTournamentManager = (): TournamentManagerHook => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const { toast } = useToast();

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      setLoadError("");
      
      // Load from localStorage
      const storedTournaments = localStorage.getItem('tournaments');
      if (storedTournaments) {
        const parsed = JSON.parse(storedTournaments);
        setTournaments(Array.isArray(parsed) ? parsed : []);
      } else {
        setTournaments([]);
      }
    } catch (error) {
      console.error("Error loading tournaments:", error);
      setLoadError("Failed to load tournaments");
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const createTournament = (tournamentData: TournamentFormData, customTimeControl: string, isCustomTimeControl: boolean): boolean => {
    try {
      const timeControl = isCustomTimeControl ? customTimeControl : tournamentData.timeControl || "60+30";
      
      const newTournament: Tournament = {
        id: `tournament-${Date.now()}`,
        name: tournamentData.name || "",
        description: tournamentData.description || "",
        start_date: tournamentData.startDate?.toISOString().split('T')[0] || "",
        end_date: tournamentData.endDate?.toISOString().split('T')[0] || "",
        location: tournamentData.location || "",
        city: tournamentData.city || "",
        state: tournamentData.state || "",
        organizer_id: "organizer-1",
        status: "pending" as const,
        rounds: tournamentData.rounds || 5,
        current_round: 1,
        time_control: timeControl,
        participants: 0,
        registration_open: tournamentData.registrationOpen ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        players: [],
        pairings: [],
        results: []
      };

      const updatedTournaments = [...tournaments, newTournament];
      setTournaments(updatedTournaments);
      localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
      
      toast({
        title: "Success",
        description: "Tournament created successfully",
      });
      
      return true;
    } catch (error) {
      console.error("Error creating tournament:", error);
      toast({
        title: "Error",
        description: "Failed to create tournament",
        variant: "destructive",
      });
      return false;
    }
  };

  const generatePairings = async (tournamentId: string) => {
    // Implementation for generating pairings
    console.log("Generating pairings for tournament:", tournamentId);
  };

  const recordResult = async (tournamentId: string, pairingId: string, result: string) => {
    // Implementation for recording results
    console.log("Recording result:", { tournamentId, pairingId, result });
  };

  const addPlayerToTournament = async (tournamentId: string, players: Player[]) => {
    // Implementation for adding players
    console.log("Adding players to tournament:", { tournamentId, players });
  };

  const removePlayerFromTournament = async (tournamentId: string, playerId: string) => {
    // Implementation for removing player
    console.log("Removing player from tournament:", { tournamentId, playerId });
  };

  const toggleRegistration = async (tournamentId: string) => {
    // Implementation for toggling registration
    console.log("Toggling registration for tournament:", tournamentId);
  };

  const startTournament = async (tournamentId: string) => {
    // Implementation for starting tournament
    console.log("Starting tournament:", tournamentId);
  };

  const completeTournament = async (tournamentId: string) => {
    // Implementation for completing tournament
    console.log("Completing tournament:", tournamentId);
  };

  const nextRound = async (tournamentId: string) => {
    // Implementation for next round
    console.log("Moving to next round:", tournamentId);
  };

  const retry = () => {
    loadTournaments();
  };

  return {
    tournaments,
    isLoading,
    loadError,
    createTournament,
    loadTournaments,
    retry,
    generatePairings,
    recordResult,
    addPlayerToTournament,
    removePlayerFromTournament,
    toggleRegistration,
    startTournament,
    completeTournament,
    nextRound
  };
};
