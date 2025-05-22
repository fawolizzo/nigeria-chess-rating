
import { Player, Tournament, User } from "@/lib/mockData";
import { getAllPlayersFromSupabase, getUsersFromSupabase, createPlayerInSupabase, updatePlayerInSupabase } from "./playerService";
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
    // Try to get users from Supabase first
    const supabaseUsers = await getUsersFromSupabase();
    if (supabaseUsers.length > 0) {
      return supabaseUsers;
    }
    // Fallback to local storage
    return users;
  } catch (error) {
    console.error("Error getting users:", error);
    return users;
  }
};

export const addPlayer = async (player: Player): Promise<Player> => {
  try {
    // Try to add to Supabase first
    const supabasePlayer = await createPlayerInSupabase({
      name: player.name,
      email: player.email || "",
      phone: player.phone,
      rating: player.rating || FLOOR_RATING,
      gender: player.gender,
      state: player.state,
      city: player.city,
      status: player.status
    });

    if (supabasePlayer) {
      return supabasePlayer;
    }

    // Fallback to local storage
    players.push(player);
    return player;
  } catch (error) {
    console.error("Error adding player:", error);
    // Still add to local storage if Supabase fails
    players.push(player);
    return player;
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

export const getPlayersByTournamentId = (tournamentId: string): Player[] => {
  const tournament = tournaments.find(t => t.id === tournamentId);
  if (!tournament || !tournament.playerIds) {
    return [];
  }
  return players.filter(p => tournament.playerIds.includes(p.id));
};

export const updateTournament = (updatedTournament: Tournament): Tournament => {
  const index = tournaments.findIndex(t => t.id === updatedTournament.id);
  if (index !== -1) {
    tournaments[index] = updatedTournament;
  }
  return updatedTournament;
};

// Initialize with some default data if needed
export const initializeMockServices = () => {
  if (players.length === 0) {
    players = [
      {
        id: generateUniquePlayerID(),
        name: "Demo Player",
        rating: 1200,
        gender: "M",
        gamesPlayed: 10,
        status: "approved",
        tournamentResults: [],
        ratingHistory: [],
        state: "Lagos"
      }
    ];
  }
};

// Initialize mock data
initializeMockServices();
