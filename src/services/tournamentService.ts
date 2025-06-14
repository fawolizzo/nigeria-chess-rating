
import { Tournament } from "@/lib/mockData";
import { v4 as uuidv4 } from "uuid";
import { saveToStorage, getFromStorage } from "@/utils/storageUtils";
import { Player } from "@/lib/mockData";

export const createTournament = async (tournamentData: Partial<Tournament>): Promise<Tournament> => {
  const newTournament: Tournament = {
    id: uuidv4(),
    name: tournamentData.name || "",
    start_date: tournamentData.start_date || new Date().toISOString(),
    end_date: tournamentData.end_date || new Date().toISOString(),
    location: tournamentData.location || "",
    rounds: tournamentData.rounds || 5,
    time_control: tournamentData.time_control || "90+30",
    description: tournamentData.description || "",
    organizer_id: tournamentData.organizer_id || "",
    status: "pending",
    participants: 0,
    current_round: 1,
    registration_open: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    city: tournamentData.city || "",
    state: tournamentData.state || "",
    players: [],
    pairings: [],
    results: []
  };

  try {
    const tournaments = getFromStorage('tournaments', []);
    tournaments.push(newTournament);
    saveToStorage('tournaments', tournaments);
    return newTournament;
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw new Error("Failed to create tournament");
  }
};

export const createTournamentInSupabase = async (tournamentData: Partial<Tournament>): Promise<Tournament> => {
  return createTournament(tournamentData);
};

export const getAllTournamentsFromSupabase = async (filters: {
  status?: string;
  organizerId?: string;
} = {}): Promise<Tournament[]> => {
  try {
    let tournaments = getFromStorage<Tournament[]>('tournaments', []);

    if (!Array.isArray(tournaments)) {
      console.warn("Tournaments data is not an array, returning empty array");
      return [];
    }

    // Filter by status
    if (filters.status && filters.status !== 'all') {
      tournaments = tournaments.filter(tournament => tournament && tournament.status === filters.status);
    }

    // Filter by organizerId
    if (filters.organizerId) {
      tournaments = tournaments.filter(tournament => tournament && tournament.organizer_id === filters.organizerId);
    }

    return tournaments;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
};

export const getTournamentsFromSupabase = async (filters: {
  status?: string;
  organizerId?: string;
} = {}): Promise<Tournament[]> => {
  return getAllTournamentsFromSupabase(filters);
};

export const getTournamentFromSupabase = async (id: string): Promise<Tournament | null> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    return tournaments.find((t: Tournament) => t.id === id) || null;
  } catch (error) {
    console.error("Error getting tournament:", error);
    return null;
  }
};

export const updateTournamentInSupabase = async (id: string, updates: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === id);

    if (tournamentIndex === -1) {
      console.error("Tournament not found:", id);
      return null;
    }

    const updatedTournament = {
      ...tournaments[tournamentIndex],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    tournaments[tournamentIndex] = updatedTournament;
    saveToStorage('tournaments', tournaments);

    return updatedTournament;
  } catch (error) {
    console.error("Error updating tournament:", error);
    return null;
  }
};

export const deleteTournamentInSupabase = async (id: string): Promise<boolean> => {
  try {
    let tournaments = getFromStorage('tournaments', []);
    tournaments = tournaments.filter((t: Tournament) => t.id !== id);
    saveToStorage('tournaments', tournaments);
    return true;
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return false;
  }
};

export const addPlayerToTournament = async (tournamentId: string, players: Player[]): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      return false;
    }
    
    const tournament = tournaments[tournamentIndex];
    if (!tournament.participants) {
      tournament.participants = 0;
    }
    
    // For now, just update the participant count
    tournament.participants += players.length;
    
    tournaments[tournamentIndex] = tournament;
    saveToStorage('tournaments', tournaments);
    return true;
  } catch (error) {
    console.error("Error adding players to tournament:", error);
    return false;
  }
};

export const removePlayerFromTournament = async (tournamentId: string, playerId: string): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      return false;
    }
    
    const tournament = tournaments[tournamentIndex];
    if (tournament.participants && tournament.participants > 0) {
      tournament.participants -= 1;
    }
    
    tournaments[tournamentIndex] = tournament;
    saveToStorage('tournaments', tournaments);
    return true;
  } catch (error) {
    console.error("Error removing player from tournament:", error);
    return false;
  }
};
