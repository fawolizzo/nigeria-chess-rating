
import { Tournament, Player, Pairing, Result } from "@/lib/mockData";
import { v4 as uuidv4 } from "uuid";

export const createTournament = async (tournamentData: Partial<Tournament>): Promise<Tournament> => {
  const newTournament: Tournament = {
    id: uuidv4(),
    name: tournamentData.name || "",
    description: tournamentData.description || "",
    start_date: tournamentData.start_date || new Date().toISOString(),
    end_date: tournamentData.end_date || new Date().toISOString(),
    location: tournamentData.location || "",
    city: tournamentData.city || "",
    state: tournamentData.state || "",
    organizer_id: tournamentData.organizer_id || "",
    players: [],
    pairings: [],
    rounds: tournamentData.rounds || 5,
    current_round: 1,
    status: "pending",
    time_control: tournamentData.time_control || "90+30",
    participants: 0,
    registration_open: tournamentData.registration_open ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    tournaments.push(newTournament);
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    return newTournament;
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw new Error("Failed to create tournament");
  }
};

export const updateTournament = async (id: string, updates: Partial<Tournament>): Promise<Tournament> => {
  try {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const index = tournaments.findIndex((t: Tournament) => t.id === id);
    
    if (index === -1) {
      throw new Error("Tournament not found");
    }

    const updatedTournament = {
      ...tournaments[index],
      ...updates,
      updated_at: new Date().toISOString()
    };

    tournaments[index] = updatedTournament;
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    
    return updatedTournament;
  } catch (error) {
    console.error("Error updating tournament:", error);
    throw new Error("Failed to update tournament");
  }
};

export const getTournament = async (id: string): Promise<Tournament | null> => {
  try {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    return tournaments.find((t: Tournament) => t.id === id) || null;
  } catch (error) {
    console.error("Error getting tournament:", error);
    return null;
  }
};

export const deleteTournament = async (id: string): Promise<boolean> => {
  try {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const filtered = tournaments.filter((t: Tournament) => t.id !== id);
    localStorage.setItem('tournaments', JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return false;
  }
};

export const addPlayerToTournament = async (tournamentId: string, playerId: string): Promise<boolean> => {
  try {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const tournament = tournaments.find((t: Tournament) => t.id === tournamentId);
    
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    if (!tournament.players.includes(playerId)) {
      tournament.players.push(playerId);
      tournament.participants = tournament.players.length;
      tournament.updated_at = new Date().toISOString();
      localStorage.setItem('tournaments', JSON.stringify(tournaments));
    }
    
    return true;
  } catch (error) {
    console.error("Error adding player to tournament:", error);
    return false;
  }
};

export const removePlayerFromTournament = async (tournamentId: string, playerId: string): Promise<boolean> => {
  try {
    const tournaments = JSON.parse(localStorage.getItem('tournaments') || '[]');
    const tournament = tournaments.find((t: Tournament) => t.id === tournamentId);
    
    if (!tournament) {
      throw new Error("Tournament not found");
    }

    tournament.players = tournament.players.filter((id: string) => id !== playerId);
    tournament.participants = tournament.players.length;
    tournament.updated_at = new Date().toISOString();
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    
    return true;
  } catch (error) {
    console.error("Error removing player from tournament:", error);
    return false;
  }
};
