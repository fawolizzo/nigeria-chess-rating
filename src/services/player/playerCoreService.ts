import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { saveToStorageSync, getFromStorageSync } from "@/utils/storageUtils";

export const createPlayer = async (playerData: Partial<Player>): Promise<Player> => {
  console.log('🔄 createPlayer called with data:', {
    name: playerData.name,
    email: playerData.email,
    status: playerData.status,
    rating: playerData.rating
  });
  
  if (!playerData.name || !playerData.email) {
    const error = "Player name and email are required";
    console.error('❌ createPlayer validation failed:', error);
    throw new Error(error);
  }
  
  // Test Supabase connection first
  try {
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection test failed:', testError);
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    console.log('✅ Supabase connection test successful');
  } catch (connectionError) {
    console.error('❌ Supabase connection error:', connectionError);
    throw new Error(`Database connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
  }
  
  // Map to Supabase schema properly
  const supabasePlayer = {
    name: playerData.name,
    email: playerData.email,
    status: playerData.status || "approved",
    rating: playerData.rating || 800,
    rapid_rating: playerData.rapidRating || 800,
    blitz_rating: playerData.blitzRating || 800,
    games_played: playerData.gamesPlayed || 31,
    rapid_games_played: playerData.rapidGamesPlayed || 31,
    blitz_games_played: playerData.blitzGamesPlayed || 31,
    gender: playerData.gender || "M",
    state: playerData.state || "",
    city: playerData.city || "",
    phone: playerData.phone || "",
    club: playerData.club || "",
    title: playerData.title || null,
    title_verified: playerData.titleVerified || false,
    fide_id: playerData.fideId || null,
    birth_year: playerData.birthYear || null
  };
  
  console.log('📤 createPlayer: Sending to Supabase:', supabasePlayer);
  
  const { data, error } = await supabase
    .from('players')
    .insert([supabasePlayer])
    .select()
    .single();
    
  if (error) {
    console.error("❌ Error creating player in Supabase:", error);
    console.error("❌ Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
  }
  
  const createdPlayer = data as Player;
  console.log('✅ createPlayer: Successfully created in Supabase:', createdPlayer.name);
  
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
    console.log('🔄 Starting player sync from Supabase to localStorage...');
    const { data, error } = await supabase
      .from('players')
      .select('*');
      
    if (error) {
      console.error("❌ Error fetching players from Supabase for sync:", error);
      return;
    }
    
    console.log('📊 Fetched players from Supabase:', data?.length || 0, 'players');
    
    if (Array.isArray(data)) {
      saveToStorageSync('players', data);
      console.log('✅ Synced', data.length, 'players from Supabase to localStorage');
      
      // Debug: Show some player details
      if (data.length > 0) {
        console.log('📋 Sample players synced:', data.slice(0, 3).map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          status: p.status
        })));
      }
    } else {
      console.log('⚠️ No players data from Supabase or data is not an array');
    }
  } catch (error) {
    console.error("❌ Error syncing players to localStorage:", error);
  }
};
