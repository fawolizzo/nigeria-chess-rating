import { Player, Tournament, User } from "@/lib/mockData";
import { getAllPlayersFromSupabase, getAllUsers as fetchOrganizersFromPlayerService, createPlayerInSupabase, updatePlayerInSupabase } from "./playerService";
import { FLOOR_RATING } from "@/lib/ratingCalculation";
import { generateUniquePlayerID } from "@/lib/playerDataUtils";

// Mock player data storage
let players: Player[] = [];
let users: User[] = [];
let tournaments: Tournament[] = [];

// These functions replace the ones that were previously imported from mockData
export const getAllPlayers = async (): Promise<Player[]> => {
  try {
    // Try to get players from Supabase first
    const supabasePlayers = await getAllPlayersFromSupabase({});
    if (supabasePlayers.length > 0) {
      return supabasePlayers;
    }
    // Fallback to local storage
    return players;
  } catch (error) {
    console.error("Error getting players:", error);
    return players;
  }
};

export const getPlayerById = async (id: string): Promise<Player | null> => {
  try {
    const allPlayers = await getAllPlayers();
    return allPlayers.find(p => p.id === id) || null;
  } catch (error) {
    console.error(`Error getting player with ID ${id}:`, error);
    return null;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    // Try to get users from Supabase first (fetches organizers as per playerService.ts)
    const supabaseUsers = await fetchOrganizersFromPlayerService();
    if (supabaseUsers.length > 0) {
      // Assuming the structure from 'organizers' table matches 'User' type for now
      return supabaseUsers as User[]; 
    }
    // Fallback to local storage
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return users;
  }
};

export const addPlayer = async (player: Omit<Player, "id" | "ratingHistory" | "tournamentResults">): Promise<Player> => {
  try {
    // Try to add to Supabase first
    const supabasePlayer = await createPlayerInSupabase({
      name: player.name,
      rating: player.rating || FLOOR_RATING,
      gender: player.gender,
      state: player.state,
      city: player.city,
      status: player.status,
      gamesPlayed: player.gamesPlayed || 0,
      // Only include phone if it exists in the Player type
      ...(player as any).phone ? { phone: (player as any).phone } : {},
    });

    if (supabasePlayer) {
      return supabasePlayer;
    }

    // Fallback to local storage
    const newPlayer = {
      ...player,
      id: generateUniquePlayerID(),
      ratingHistory: [],
      tournamentResults: [],
      rapidRating: FLOOR_RATING,
      blitzRating: FLOOR_RATING,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
      ratingStatus: 'provisional' as const,
      rapidRatingStatus: 'provisional' as const,
      blitzRatingStatus: 'provisional' as const
    } as Player;
    
    players.push(newPlayer);
    return newPlayer;
  } catch (error) {
    console.error("Error adding player:", error);
    // Still add to local storage if Supabase fails
    const newPlayer = {
      ...player,
      id: generateUniquePlayerID(),
      ratingHistory: [],
      tournamentResults: [],
      rapidRating: FLOOR_RATING,
      blitzRating: FLOOR_RATING,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
      ratingStatus: 'provisional' as const,
      rapidRatingStatus: 'provisional' as const,
      blitzRatingStatus: 'provisional' as const
    } as Player;
    
    players.push(newPlayer);
    return newPlayer;
  }
};

export const updatePlayer = async (player: Player): Promise<Player> => {
  try {
    // Try to update in Supabase first
    const updatedPlayer = await updatePlayerInSupabase(player.id, player);
    if (updatedPlayer) {
      return updatedPlayer;
    }

    // Fallback to local storage
    const index = players.findIndex(p => p.id === player.id);
    if (index !== -1) {
      players[index] = player;
    }
    return player;
  } catch (error) {
    console.error(`Error updating player with ID ${player.id}:`, error);
    // Still update local storage if Supabase fails
    const index = players.findIndex(p => p.id === player.id);
    if (index !== -1) {
      players[index] = player;
    }
    return player;
  }
};

export const getAllTournaments = (): Tournament[] => {
  return tournaments;
};

export const getTournamentById = (id: string): Tournament | undefined => {
  return tournaments.find(t => t.id === id);
};

export const getPlayersByTournamentId = async (tournamentId: string): Promise<Player[]> => {
  try {
    // Get all players and filter by tournament if needed
    // This is a simplified implementation - in a real app you'd have a junction table
    const allPlayers = await getAllPlayers();
    return allPlayers; // Return all players for now since we don't have tournament-player relationships
  } catch (error) {
    console.error("Error getting players by tournament ID:", error);
    return [];
  }
};

export const updateTournament = (updatedTournament: Tournament): Tournament => {
  const index = tournaments.findIndex(t => t.id === updatedTournament.id);
  if (index !== -1) {
    tournaments[index] = updatedTournament;
  }
  return updatedTournament;
};

// Initialize with empty arrays - no demo players
export const initializeMockServices = () => {
  // Keep all arrays empty - data will come from Supabase or user creation
  players = [];
  users = [];
  tournaments = [];
};

// Initialize mock data
initializeMockServices();
