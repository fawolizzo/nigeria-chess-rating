
import { Tournament, Player } from "@/lib/mockData";
import { getFromStorage, saveToStorage } from "@/utils/storageUtils";

export const addPlayerToTournament = async (tournamentId: string, players: Player[]): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      console.error("Tournament not found:", tournamentId);
      return false;
    }

    const tournament = tournaments[tournamentIndex];
    const existingPlayerIds = tournament.players?.map((p: Player) => p.id) || [];
    
    // Add new players that aren't already in the tournament
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

export const removePlayerFromTournament = async (tournamentId: string, playerId: string): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: Tournament) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      console.error("Tournament not found:", tournamentId);
      return false;
    }

    const tournament = tournaments[tournamentIndex];
    const updatedPlayers = (tournament.players || []).filter((p: Player) => p.id !== playerId);
    
    tournaments[tournamentIndex] = {
      ...tournament,
      players: updatedPlayers,
      participants: updatedPlayers.length
    };

    saveToStorage('tournaments', tournaments);
    return true;
  } catch (error) {
    console.error("Error removing player from tournament:", error);
    return false;
  }
};
