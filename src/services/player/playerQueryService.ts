import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export const getAllPlayersFromSupabase = async (filters: {
  state?: string;
  city?: string;
  status?: string;
} = {}): Promise<Player[]> => {
  console.log('🔄 getAllPlayersFromSupabase called with filters:', filters);
  
  // Test connection first
  try {
    console.log('🔍 Testing Supabase read connection...');
    const { data: testData, error: testError } = await supabase
      .from('players')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase read connection test failed:', testError);
      throw new Error(`Supabase connection failed: ${testError.message}`);
    }
    console.log('✅ Supabase read connection test successful');
  } catch (connectionError) {
    console.error('❌ Supabase read connection error:', connectionError);
    throw new Error(`Database connection failed: ${connectionError instanceof Error ? connectionError.message : 'Unknown error'}`);
  }
  
  let query = supabase.from('players').select('*');

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.city) {
    query = query.eq('city', filters.city);
  }

  const { data, error } = await query;
  
  console.log('📊 Supabase query result:', {
    dataLength: data?.length || 0,
    error: error?.message || 'none',
    errorCode: error?.code || 'none',
    filters
  });
  
  if (error) {
    console.error("❌ Error fetching players from Supabase:", error);
    console.error("❌ Error details:", {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    });
    throw new Error(`Database error: ${error.message} (Code: ${error.code})`);
  }
  
  if (!Array.isArray(data)) {
    console.error("❌ Data is not an array:", typeof data, data);
    return [];
  }
  
  // Transform snake_case data to camelCase Player interface
  const transformedData = data.map(transformSupabasePlayer);
  
  // Optionally sort by rating
  const sortedData = transformedData.sort((a, b) => (b.rating || 800) - (a.rating || 800));
  console.log('✅ Returning', sortedData.length, 'players from Supabase');
  
  return sortedData;
};

export const getAllUsers = async (): Promise<Player[]> => {
  const { data, error } = await supabase.from('players').select('*');
  if (error || !Array.isArray(data)) {
    console.error("❌ Error fetching all users from Supabase:", error);
    return [];
  }
  return data.map(transformSupabasePlayer);
};

export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) {
    console.error("❌ Error getting player from Supabase:", error);
    return null;
  }
  return transformSupabasePlayer(data);
};

// Transform snake_case Supabase data to camelCase Player interface
const transformSupabasePlayer = (supabasePlayer: any): Player => {
  return {
    id: supabasePlayer.id,
    name: supabasePlayer.name,
    email: supabasePlayer.email,
    phone: supabasePlayer.phone,
    fideId: supabasePlayer.fide_id,
    title: supabasePlayer.title as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" | undefined,
    titleVerified: supabasePlayer.title_verified,
    rating: supabasePlayer.rating,
    rapidRating: supabasePlayer.rapid_rating,
    blitzRating: supabasePlayer.blitz_rating,
    state: supabasePlayer.state,
    city: supabasePlayer.city,
    country: "Nigeria", // Default value
    gender: supabasePlayer.gender as "M" | "F",
    status: supabasePlayer.status as "pending" | "approved" | "rejected",
    created_at: supabasePlayer.created_at,
    gamesPlayed: supabasePlayer.games_played,
    rapidGamesPlayed: supabasePlayer.rapid_games_played,
    blitzGamesPlayed: supabasePlayer.blitz_games_played,
    birthYear: supabasePlayer.birth_year,
    club: supabasePlayer.club,
    // Initialize empty arrays for fields not in Supabase schema
    ratingHistory: [],
    rapidRatingHistory: [],
    blitzRatingHistory: [],
    achievements: [],
    tournamentResults: []
  };
};
