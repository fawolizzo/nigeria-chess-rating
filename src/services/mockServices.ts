
import { Tournament, Player } from "@/lib/mockData";
import { getAllUsers, createPlayerInSupabase } from "./playerService";

export const getAllTournaments = async (): Promise<Tournament[]> => {
  try {
    const tournaments = localStorage.getItem('tournaments');
    return tournaments ? JSON.parse(tournaments) : [];
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
};

export const getAllPlayers = async (): Promise<Player[]> => {
  return getAllUsers();
};

export const createPlayer = async (playerData: Partial<Player>): Promise<Player> => {
  return createPlayerInSupabase(playerData);
};
