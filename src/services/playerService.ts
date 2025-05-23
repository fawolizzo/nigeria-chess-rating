
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/lib/mockData";
import { FLOOR_RATING } from "@/lib/ratingCalculation";

interface PlayerFilter {
  state?: string;
  city?: string;
  name?: string;
  status?: string;
}

export const getAllPlayersFromSupabase = async (filters: PlayerFilter): Promise<Player[]> => {
  try {
    let query = supabase.from('players').select('*');
    
    // Apply filters if provided
    if (filters.state) query = query.eq('state', filters.state);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.name) query = query.ilike('name', `%${filters.name}%`);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Map database fields to our application model
    return (data || []).map(player => ({
      id: player.id,
      name: player.name,
      rating: player.rating || FLOOR_RATING,
      gender: 'M', // Default since not in DB
      state: '', // Default since not in DB
      city: '', // Default since not in DB
      status: 'approved', // Default since not in DB
      gamesPlayed: 0, // Default since not in DB
      phone: player.phone || '',
      email: player.email || '',
      ratingHistory: [], // Default since not in DB
      tournamentResults: [], // Default since not in DB
      rapidRating: FLOOR_RATING, // Default since not in DB
      blitzRating: FLOOR_RATING, // Default since not in DB
      rapidGamesPlayed: 0, // Default since not in DB
      blitzGamesPlayed: 0, // Default since not in DB
      ratingStatus: 'provisional', // Default since not in DB
      rapidRatingStatus: 'provisional', // Default since not in DB
      blitzRatingStatus: 'provisional' // Default since not in DB
    }));
  } catch (error) {
    console.error("Error getting players from Supabase:", error);
    return [];
  }
};

export const getPlayerByIdFromSupabase = async (playerId: string): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      rating: data.rating || FLOOR_RATING,
      gender: 'M', // Default
      state: '', // Default
      city: '', // Default
      status: 'approved', // Default
      gamesPlayed: 0, // Default
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: [],
      tournamentResults: [],
      rapidRating: FLOOR_RATING,
      blitzRating: FLOOR_RATING,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
      ratingStatus: 'provisional',
      rapidRatingStatus: 'provisional',
      blitzRatingStatus: 'provisional'
    };
  } catch (error) {
    console.error(`Error getting player ${playerId} from Supabase:`, error);
    return null;
  }
};

export const getUsersFromSupabase = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase.from('organizers').select('*');
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error getting users from Supabase:", error);
    return [];
  }
};

export const createPlayerInSupabase = async (playerData: any): Promise<Player | null> => {
  try {
    const dbPlayerData = {
      name: playerData.name,
      rating: playerData.rating || FLOOR_RATING,
      phone: playerData.phone || '',
      email: playerData.email || ''
    };

    const { data, error } = await supabase
      .from('players')
      .insert([dbPlayerData])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      rating: data.rating || FLOOR_RATING,
      gender: playerData.gender || 'M',
      state: playerData.state || '',
      city: playerData.city || '',
      status: playerData.status || 'pending',
      gamesPlayed: playerData.gamesPlayed || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: [],
      tournamentResults: [],
      rapidRating: FLOOR_RATING,
      blitzRating: FLOOR_RATING,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
      ratingStatus: 'provisional',
      rapidRatingStatus: 'provisional',
      blitzRatingStatus: 'provisional'
    };
  } catch (error) {
    console.error("Error creating player in Supabase:", error);
    return null;
  }
};

export const updatePlayerInSupabase = async (playerId: string, playerData: Partial<Player>): Promise<Player | null> => {
  try {
    const dbPlayerData: Record<string, any> = {};
    
    if (playerData.name !== undefined) dbPlayerData.name = playerData.name;
    if (playerData.rating !== undefined) dbPlayerData.rating = playerData.rating;
    if (playerData.phone !== undefined) dbPlayerData.phone = playerData.phone;
    if (playerData.email !== undefined) dbPlayerData.email = playerData.email;

    const { data, error } = await supabase
      .from('players')
      .update(dbPlayerData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      rating: data.rating || FLOOR_RATING,
      gender: playerData.gender || 'M',
      state: playerData.state || '',
      city: playerData.city || '',
      status: playerData.status || 'approved',
      gamesPlayed: playerData.gamesPlayed || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: playerData.ratingHistory || [],
      tournamentResults: playerData.tournamentResults || [],
      rapidRating: FLOOR_RATING,
      blitzRating: FLOOR_RATING,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
      ratingStatus: 'provisional',
      rapidRatingStatus: 'provisional',
      blitzRatingStatus: 'provisional'
    };
  } catch (error) {
    console.error(`Error updating player ${playerId} in Supabase:`, error);
    return null;
  }
};
