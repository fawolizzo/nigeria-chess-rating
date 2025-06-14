
import { Player } from "@/lib/mockData";
import { saveToStorage, getFromStorage } from "@/utils/storageUtils";

export const addPlayerToTournament = async (tournamentId: string, players: Player[]): Promise<boolean> => {
  try {
    const tournaments = getFromStorage('tournaments', []);
    const tournamentIndex = tournaments.findIndex((t: any) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      return false;
    }
    
    const tournament = tournaments[tournamentIndex];
    if (!tournament.players) {
      tournament.players = [];
    }
    
    // Add players that aren't already in the tournament
    players.forEach(player => {
      if (!tournament.players.find((p: Player) => p.id === player.id)) {
        tournament.players.push(player);
      }
    });
    
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
    const tournamentIndex = tournaments.findIndex((t: any) => t.id === tournamentId);
    
    if (tournamentIndex === -1) {
      return false;
    }
    
    const tournament = tournaments[tournamentIndex];
    if (tournament.players) {
      tournament.players = tournament.players.filter((p: Player) => p.id !== playerId);
    }
    
    tournaments[tournamentIndex] = tournament;
    saveToStorage('tournaments', tournaments);
    return true;
  } catch (error) {
    console.error("Error removing player from tournament:", error);
    return false;
  }
};
