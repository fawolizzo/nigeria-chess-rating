
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
    gamesPlayed: 0,
    created_at: new Date().toISOString()
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

export const createPlayerInSupabase = async (playerData: Partial<Player>): Promise<Player> => {
  return createPlayer(playerData);
};

const isTitle = (title: any): title is "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" => {
  return ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM"].includes(title);
};

export const getAllPlayersFromSupabase = async (filters: {
  state?: string;
  city?: string;
  status?: string;
}): Promise<Player[]> => {
  try {
    let players = getFromStorage('players', []);
    
    // Ensure we return an array
    if (!Array.isArray(players)) {
      console.warn("Players data is not an array, returning empty array");
      return [];
    }
    
    if (filters.state && filters.state !== "") {
      players = players.filter((player: Player) => player && player.state === filters.state);
    }
    
    if (filters.city && filters.city !== "" && filters.city !== "all-cities") {
      players = players.filter((player: Player) => player && player.city === filters.city);
    }
    
    if (filters.status) {
      players = players.filter((player: Player) => player && player.status === filters.status);
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

export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  return getPlayerFromSupabase(id);
};

export const uploadPlayersFromExcel = async (file: File): Promise<{ success: boolean; message: string; count?: number }> => {
  try {
    const XLSX = await import('xlsx');
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    const players = getFromStorage('players', []);
    let addedCount = 0;

    for (const row of jsonData) {
      const rowData = row as any;
      
      const playerData = {
        name: rowData.Name || rowData.name || "",
        email: rowData.Email || rowData.email || "",
        phone: rowData.Phone || rowData.phone || "",
        state: rowData.State || rowData.state || "",
        city: rowData.City || rowData.city || "",
        rating: parseInt(rowData.Rating || rowData.rating) || 800,
        rapidRating: parseInt(rowData.RapidRating || rowData.rapidRating) || 800,
        blitzRating: parseInt(rowData.BlitzRating || rowData.blitzRating) || 800,
        title: (rowData.Title || rowData.title || "") as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" | undefined,
        titleVerified: Boolean(rowData.TitleVerified || rowData.titleVerified || false),
        fideId: rowData.FideId || rowData.fideId || ""
      };

      const existingPlayer = players.find((p: Player) => 
        p.email === playerData.email || p.name === playerData.name
      );

      if (!existingPlayer && playerData.name && playerData.email) {
        const newPlayer = await createPlayer(playerData);
        addedCount++;
      }
    }

    return {
      success: true,
      message: `Successfully uploaded ${addedCount} players`,
      count: addedCount
    };
  } catch (error) {
    console.error("Error uploading players:", error);
    return {
      success: false,
      message: "Failed to upload players from Excel file"
    };
  }
};

export const approvePlayerInSupabase = async (id: string): Promise<boolean> => {
  try {
    const result = await updatePlayerInSupabase(id, { status: "approved" });
    return result !== null;
  } catch (error) {
    console.error("Error approving player:", error);
    return false;
  }
};

export const rejectPlayerInSupabase = async (id: string): Promise<boolean> => {
  try {
    const result = await updatePlayerInSupabase(id, { status: "rejected" });
    return result !== null;
  } catch (error) {
    console.error("Error rejecting player:", error);
    return false;
  }
};
