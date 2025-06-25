import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { saveToStorageSync, getFromStorageSync } from "@/utils/storageUtils";

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
  const createdPlayer = data as Player;
  
  // Also save to localStorage for RO dashboard compatibility
  try {
    const existingPlayers = getFromStorageSync('players', []);
    const updatedPlayers = Array.isArray(existingPlayers) ? [...existingPlayers, createdPlayer] : [createdPlayer];
    saveToStorageSync('players', updatedPlayers);
    console.log('✅ Player saved to both Supabase and localStorage:', createdPlayer.name);
  } catch (localError) {
    console.error('⚠️ Error saving to localStorage (continuing with Supabase):', localError);
  }
  
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
    console.error("❌ Error updating player in Supabase:", error);
    return null;
  }
  const updatedPlayer = data as Player;
  
  // Also update localStorage for RO dashboard compatibility
  try {
    const existingPlayers = getFromStorageSync('players', []);
    if (Array.isArray(existingPlayers)) {
      const updatedPlayers = existingPlayers.map(player => 
        player.id === id ? { ...player, ...updates } : player
      );
      saveToStorageSync('players', updatedPlayers);
      console.log('✅ Player updated in both Supabase and localStorage:', updatedPlayer.name);
    }
  } catch (localError) {
    console.error('⚠️ Error updating localStorage (continuing with Supabase):', localError);
  }
  
  return updatedPlayer;
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

// New function to sync players between Supabase and localStorage
export const syncPlayersToLocalStorage = async (): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*');
      
    if (error) {
      console.error("❌ Error fetching players from Supabase for sync:", error);
      return;
    }
    
    if (Array.isArray(data)) {
      saveToStorageSync('players', data);
      console.log('✅ Synced', data.length, 'players from Supabase to localStorage');
    }
  } catch (error) {
    console.error("❌ Error syncing players to localStorage:", error);
  }
};
