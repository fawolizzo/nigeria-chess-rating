import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export const createPlayer = async (playerData: Partial<Player>): Promise<Player> => {
  if (!playerData.name || !playerData.email) {
    throw new Error("Player name and email are required");
  }
  // Map to Supabase schema if needed (e.g., snake_case)
  const supabasePlayer = {
    ...playerData,
    name: playerData.name,
    email: playerData.email,
    // Add defaults if needed
    status: playerData.status || "approved",
    rating: playerData.rating || 800,
    rapidRating: playerData.rapidRating || 800,
    blitzRating: playerData.blitzRating || 800,
    created_at: playerData.created_at || new Date().toISOString(),
    gender: playerData.gender || "M",
    country: playerData.country || "Nigeria"
  };
  const { data, error } = await supabase
    .from('players')
    .insert([supabasePlayer])
    .select()
    .single();
  if (error) {
    console.error("❌ Error creating player in Supabase:", error);
    throw new Error(error.message);
  }
  return data as Player;
};

export const updatePlayerInSupabase = async (id: string, updates: Partial<Player>): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error("❌ Error updating player in Supabase:", error);
    return null;
  }
  return data as Player;
};

export const getPlayerFromSupabase = async (id: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error("❌ Error getting player from Supabase:", error);
    return null;
  }
  return data as Player;
};
