
import { Player } from "@/lib/mockData";
import { getFromStorage } from "@/utils/storageUtils";

export const getAllPlayersFromSupabase = async (filters: {
  state?: string;
  city?: string;
  status?: string;
} = {}): Promise<Player[]> => {
  try {
    console.log("🔍 getAllPlayersFromSupabase called with filters:", filters);
    
    let players = getFromStorage('players', []);
    console.log("📊 Raw players from storage:", players);
    console.log("📊 Players array length:", players?.length || 0);
    
    // Ensure we return an array
    if (!Array.isArray(players)) {
      console.warn("⚠️ Players data is not an array, returning empty array");
      return [];
    }
    
    // Log all players with their statuses before filtering
    console.log("📋 All players with statuses:", players.map(p => ({ 
      id: p?.id, 
      name: p?.name, 
      status: p?.status || 'NO_STATUS' 
    })));
    
    // Apply status filtering
    if (filters.status === 'all') {
      // Return all players regardless of status
      console.log("🔧 Returning all players (status: 'all')");
    } else if (filters.status && filters.status !== 'all') {
      // Filter for specific status
      const beforeFilterLength = players.length;
      players = players.filter((player: Player) => player && player.status === filters.status);
      console.log(`🔧 Filtered for status '${filters.status}': ${beforeFilterLength} -> ${players.length}`);
    } else {
      // Default: filter for approved players, but also include players without explicit status
      const beforeFilterLength = players.length;
      players = players.filter((player: Player) => {
        if (!player) return false;
        // Include players with 'approved' status OR players without a status (legacy data)
        return player.status === 'approved' || !player.status || player.status === undefined;
      });
      console.log(`✅ Filtered for approved/legacy players: ${beforeFilterLength} -> ${players.length}`);
    }
    
    if (filters.state && filters.state !== "") {
      const beforeFilterLength = players.length;
      players = players.filter((player: Player) => player && player.state === filters.state);
      console.log(`🌍 Filtered for state '${filters.state}': ${beforeFilterLength} -> ${players.length}`);
    }
    
    if (filters.city && filters.city !== "" && filters.city !== "all-cities") {
      const beforeFilterLength = players.length;
      players = players.filter((player: Player) => player && player.city === filters.city);
      console.log(`🏙️ Filtered for city '${filters.city}': ${beforeFilterLength} -> ${players.length}`);
    }
    
    console.log("🏁 Final filtered players:", players.length);
    console.log("📝 Final players sample:", players.slice(0, 3).map(p => ({ 
      id: p?.id, 
      name: p?.name, 
      rating: p?.rating, 
      status: p?.status 
    })));
    
    return players;
  } catch (error) {
    console.error("❌ Error fetching players:", error);
    return [];
  }
};

export const getAllUsers = async (): Promise<Player[]> => {
  console.log("👥 getAllUsers called - fetching all players regardless of status");
  return getAllPlayersFromSupabase({ status: 'all' });
};

export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  try {
    console.log("🔍 Getting player by ID:", id);
    const players = getFromStorage('players', []);
    const player = players.find((p: Player) => p.id === id) || null;
    console.log("👤 Found player:", player ? { id: player.id, name: player.name, status: player.status } : null);
    return player;
  } catch (error) {
    console.error("❌ Error getting player:", error);
    return null;
  }
};
