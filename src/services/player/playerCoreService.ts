import { Player } from "@/lib/mockData";
import { v4 as uuidv4 } from "uuid";
import { saveToStorage, getFromStorage } from "@/utils/storageUtils";

export const createPlayer = async (playerData: Partial<Player>): Promise<Player> => {
  const newPlayer: Player = {
    id: uuidv4(),
    name: playerData.name || "",
    email: playerData.email || "",
    phone: playerData.phone || "",
    state: playerData.state || "",
    city: playerData.city || "",
    rating: playerData.rating || 800,
    rapidRating: playerData.rapidRating || 800,
    blitzRating: playerData.blitzRating || 800,
    title: playerData.title as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" | undefined,
    titleVerified: playerData.titleVerified || false,
    fideId: playerData.fideId || "",
    status: "approved",
    ratingStatus: "provisional",
    gamesPlayed: playerData.gamesPlayed || 0,
    rapidGamesPlayed: playerData.rapidGamesPlayed || 0,
    blitzGamesPlayed: playerData.blitzGamesPlayed || 0,
    created_at: new Date().toISOString(),
    gender: playerData.gender || "M",
    country: playerData.country || "Nigeria",
    ratingHistory: playerData.ratingHistory || [{
      date: new Date().toISOString(),
      rating: playerData.rating || 800,
      change: 0,
      reason: "Initial rating"
    }],
    rapidRatingHistory: playerData.rapidRatingHistory || [{
      date: new Date().toISOString(),
      rating: playerData.rapidRating || 800,
      change: 0,
      reason: "Initial rapid rating"
    }],
    blitzRatingHistory: playerData.blitzRatingHistory || [{
      date: new Date().toISOString(),
      rating: playerData.blitzRating || 800,
      change: 0,
      reason: "Initial blitz rating"
    }],
    tournamentResults: playerData.tournamentResults || [],
    achievements: playerData.achievements || [],
    club: playerData.club || "",
    birthYear: playerData.birthYear,
    rapidRatingStatus: playerData.rapidRatingStatus || "provisional",
    blitzRatingStatus: playerData.blitzRatingStatus || "provisional"
  };

  try {
    console.log("🔧 Creating new player:", newPlayer.name, "with ID:", newPlayer.id);
    const players = getFromStorage('players', []);
    players.push(newPlayer);
    saveToStorage('players', players);
    console.log("✅ Player created and saved to storage. Total players:", players.length);
    return newPlayer;
  } catch (error) {
    console.error("❌ Error creating player:", error);
    throw new Error("Failed to create player");
  }
};

export const updatePlayerInSupabase = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    console.log("🔧 Updating player with ID:", id);
    const players = getFromStorage('players', []);
    const playerIndex = players.findIndex((p: Player) => p.id === id);
    
    if (playerIndex === -1) {
      console.error("❌ Player not found:", id);
      return null;
    }

    const updatedPlayer = {
      ...players[playerIndex],
      ...updates,
      title: updates.title ? updates.title as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" : players[playerIndex].title
    };

    players[playerIndex] = updatedPlayer;
    saveToStorage('players', players);
    console.log("✅ Player updated successfully:", updatedPlayer.name);
    
    return updatedPlayer;
  } catch (error) {
    console.error("❌ Error updating player:", error);
    return null;
  }
};

export const getPlayerFromSupabase = async (id: string): Promise<Player | null> => {
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
