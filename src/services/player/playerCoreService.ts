import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { saveToStorageSync, getFromStorageSync } from "@/utils/storageUtils";

export const createPlayer = async (playerData: Partial<Player>): Promise<Player> => {
  if (!playerData.name || !playerData.email) {
    throw new Error("Player name and email are required");
  }
  // Map to Supabase schema properly
  const supabasePlayer = {
    name: playerData.name,
    email: playerData.email,
    status: playerData.status || "approved",
    rating: playerData.rating || 800,
    rapid_rating: playerData.rapidRating || 800,
    blitz_rating: playerData.blitzRating || 800,
    created_at: playerData.created_at || new Date().toISOString(),
    gender: playerData.gender || "M",
    country: playerData.country || "Nigeria",
    fide_id: playerData.fideId || null,
    games_played: playerData.gamesPlayed || 31,
    rapid_games_played: playerData.rapidGamesPlayed || 31,
    blitz_games_played: playerData.blitzGamesPlayed || 31,
    birth_year: playerData.birthYear || null,
    title: playerData.title || null,
    title_verified: playerData.titleVerified || false,
    phone: playerData.phone || "",
    state: playerData.state || "",
    city: playerData.city || "",
    club: playerData.club || ""
  };
  const { data, error } = await supabase
    .from('players')
    .insert([supabasePlayer])
    .select()
    .single();
  if (error) {
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
  }
  const createdPlayer: Player = {
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    fideId: data.fide_id,
    title: data.title as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" | undefined,
    titleVerified: data.title_verified,
    rating: data.rating,
    rapidRating: data.rapid_rating,
    blitzRating: data.blitz_rating,
    state: data.state,
    city: data.city,
    country: "Nigeria",
    gender: data.gender as "M" | "F",
    status: data.status as "pending" | "approved" | "rejected",
    created_at: data.created_at,
    gamesPlayed: data.games_played,
    rapidGamesPlayed: data.rapid_games_played,
    blitzGamesPlayed: data.blitz_games_played,
    birthYear: data.birth_year,
    club: data.club,
    ratingHistory: [],
    rapidRatingHistory: [],
    blitzRatingHistory: [],
    achievements: [],
    tournamentResults: []
  };
  return createdPlayer;
};

export const updatePlayerInSupabase = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    return null;
  }
  const updatedPlayer = data as Player;
  try {
    const existingPlayers = getFromStorageSync('players', []);
    if (Array.isArray(existingPlayers)) {
      const updatedPlayers = existingPlayers.map(player => 
        player.id === id ? { ...player, ...updates } : player
      );
      saveToStorageSync('players', updatedPlayers);
    }
  } catch (localError) {}
  return updatedPlayer;
};

export const getPlayerFromSupabase = async (id: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    return null;
  }
  return data as Player;
};

export const syncPlayersToLocalStorage = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*');
    if (error) {
      return;
    }
    if (Array.isArray(data)) {
      saveToStorageSync('players', data);
    }
  } catch (error) {}
};
