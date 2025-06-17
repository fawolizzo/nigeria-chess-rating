
import { Tournament, Player, Pairing, Result } from "@/lib/mockData";
import { v4 as uuidv4 } from "uuid";
import { saveToStorage, getFromStorage } from "@/utils/storageUtils";
import { generateSwissPairings } from "@/lib/swissPairingService";

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>): Promise<Tournament> => {
  const newTournament: Tournament = {
    ...tournamentData,
    id: uuidv4(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

export const getAllTournaments = async (): Promise<Tournament[]> => {
  try {
    return getFromStorage('tournaments', []);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    return tournaments.find((t: Tournament) => t.id === id) || null;
  } catch (error) {
    console.error("Error getting tournament:", error);
    return null;
  }
};

export const updateTournament = async (id: string, updates: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === id);
    
    if (tournamentIndex === -1) {
      return null;
    }

    const updatedTournament = {
      ...tournaments[tournamentIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    tournaments[tournamentIndex] = updatedTournament;
    saveToStorage('tournaments', tournaments);
    return updatedTournament;
  } catch (error) {
    console.error("Error updating tournament:", error);
    return null;
  }
};

// Legacy exports for backward compatibility
export const createTournamentInSupabase = createTournament;
export const getTournamentsFromSupabase = getAllTournaments;
export const updateTournamentInSupabase = updateTournament;

export const addPlayerToTournament = async (tournamentId: string, players: Player[]): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      return false;
    }

    const tournament = tournaments[tournamentIndex];
    const existingPlayerIds = tournament.players?.map((p: Player) => p.id) || [];
    
    const newPlayers = players.filter(player => !existingPlayerIds.includes(player.id));
    
    tournaments[tournamentIndex] = {
      ...tournament,
      players: [...(tournament.players || []), ...newPlayers],
      participants: (tournament.participants || 0) + newPlayers.length
    };

    saveToStorage('tournaments', tournaments);
    return true;
  } catch (error) {
    console.error("Error adding players to tournament:", error);
    return false;
  }
};

export const generatePairings = async (tournamentId: string): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournament = tournaments.find((t: Tournament) => t.id === tournamentId);
    
    if (!tournament || !tournament.players) {
      return false;
    }

    const pairings = generateSwissPairings(tournament.players, tournament.current_round || 1);
    
    const updatedTournament = {
      ...tournament,
      pairings: pairings,
      updated_at: new Date().toISOString()
    };

    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    tournaments[tournamentIndex] = updatedTournament;
    saveToStorage('tournaments', tournaments);
    
    return true;
  } catch (error) {
    console.error("Error generating pairings:", error);
    return false;
  }
};

export const recordResult = async (tournamentId: string, pairingId: string, result: "1-0" | "0-1" | "1/2-1/2"): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournament = tournaments.find((t: Tournament) => t.id === tournamentId);
    
    if (!tournament) {
      return false;
    }

    // Update pairing with result
    const updatedPairings = tournament.pairings?.map((pairing: Pairing) => 
      pairing.pairingId === pairingId ? { ...pairing, result } : pairing
    ) || [];

    // Add to results
    const pairing = tournament.pairings?.find((p: Pairing) => p.pairingId === pairingId);
    if (pairing) {
      const newResult: Result = {
        id: uuidv4(),
        tournamentId,
        round: tournament.current_round || 1,
        whiteId: pairing.whitePlayerId,
        blackId: pairing.blackPlayerId,
        result,
        date: new Date().toISOString()
      };

      const updatedResults = [...(tournament.results || []), newResult];

      const updatedTournament = {
        ...tournament,
        pairings: updatedPairings,
        results: updatedResults,
        updated_at: new Date().toISOString()
      };

      const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
      tournaments[tournamentIndex] = updatedTournament;
      saveToStorage('tournaments', tournaments);
    }
    
    return true;
  } catch (error) {
    console.error("Error recording result:", error);
    return false;
  }
};

export const nextRound = async (tournamentId: string): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournament = tournaments.find((t: Tournament) => t.id === tournamentId);
    
    if (!tournament) {
      return false;
    }

    const updatedTournament = {
      ...tournament,
      current_round: (tournament.current_round || 1) + 1,
      updated_at: new Date().toISOString()
    };

    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    tournaments[tournamentIndex] = updatedTournament;
    saveToStorage('tournaments', tournaments);
    
    return true;
  } catch (error) {
    console.error("Error advancing to next round:", error);
    return false;
  }
};
