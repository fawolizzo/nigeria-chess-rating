
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
    created_at: new Date().toISOString(),
    gender: playerData.gender || "M",
    country: playerData.country || "Nigeria"
  };

  try {
    const players = getFromStorage('players', []);
    players.push(newPlayer);
    saveToStorage('players', players);
    return newPlayer;
  } catch (error) {
    console.error("Error creating player:", error);
    throw new Error("Failed to create player");
  }
};

export const updatePlayerInSupabase = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  try {
    const players = getFromStorage('players', []);
    const playerIndex = players.findIndex((p: Player) => p.id === id);
    
    if (playerIndex === -1) {
      console.error("Player not found:", id);
      return null;
    }

    const updatedPlayer = {
      ...players[playerIndex],
      ...updates,
      title: updates.title ? updates.title as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" : players[playerIndex].title
    };

    players[playerIndex] = updatedPlayer;
    saveToStorage('players', players);
    
    return updatedPlayer;
  } catch (error) {
    console.error("Error updating player:", error);
    return null;
  }
};

export const getPlayerFromSupabase = async (id: string): Promise<Player | null> => {
  try {
    const players = getFromStorage('players', []);
    return players.find((p: Player) => p.id === id) || null;
  } catch (error) {
    console.error("Error getting player:", error);
    return null;
  }
};
