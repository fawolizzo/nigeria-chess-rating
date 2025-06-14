
import { Player } from "@/lib/mockData";
import { getFromStorage } from "@/utils/storageUtils";

export const getAllPlayersFromSupabase = async (filters: {
  state?: string;
  city?: string;
  status?: string;
} = {}): Promise<Player[]> => {
  try {
    let players = getFromStorage('players', []);
    
    // Ensure we return an array
    if (!Array.isArray(players)) {
      console.warn("Players data is not an array, returning empty array");
      return [];
    }
    
    // Filter for approved players by default
    if (!filters.status) {
      players = players.filter((player: Player) => player && player.status === 'approved');
    } else if (filters.status && filters.status !== 'all') {
      players = players.filter((player: Player) => player && player.status === filters.status);
    }
    
    if (filters.state && filters.state !== "") {
      players = players.filter((player: Player) => player && player.state === filters.state);
    }
    
    if (filters.city && filters.city !== "" && filters.city !== "all-cities") {
      players = players.filter((player: Player) => player && player.city === filters.city);
    }
    
    return players;
  } catch (error) {
    console.error("Error fetching players:", error);
    return [];
  }
};

export const getAllUsers = async (): Promise<Player[]> => {
  return getAllPlayersFromSupabase({});
};

export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  try {
    const players = getFromStorage('players', []);
    return players.find((p: Player) => p.id === id) || null;
  } catch (error) {
    console.error("Error getting player:", error);
    return null;
  }
};
