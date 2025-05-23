
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/lib/mockData";
import { FLOOR_RATING } from "@/lib/ratingCalculation";
import { generateUniquePlayerID } from "@/lib/playerDataUtils";

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
      gender: player.gender || 'M',
      state: player.state || '',
      city: player.city || '',
      status: player.status || 'pending',
      gamesPlayed: player.games_played || 0,
      phone: player.phone || '',
      email: player.email || '',
      ratingHistory: player.rating_history || [],
      tournamentResults: player.tournament_results || [],
      // Add default values for optional fields
      rapidRating: player.rapid_rating || FLOOR_RATING,
      blitzRating: player.blitz_rating || FLOOR_RATING,
      rapidGamesPlayed: player.rapid_games_played || 0,
      blitzGamesPlayed: player.blitz_games_played || 0,
      ratingStatus: player.rating_status || 'provisional',
      rapidRatingStatus: player.rapid_rating_status || 'provisional',
      blitzRatingStatus: player.blitz_rating_status || 'provisional'
    }));
  } catch (error) {
    console.error("Error getting players from Supabase:", error);
    return [];
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
    // Map application model fields to database fields
    const dbPlayerData = {
      name: playerData.name,
      rating: playerData.rating || FLOOR_RATING,
      gender: playerData.gender,
      state: playerData.state,
      city: playerData.city,
      status: playerData.status || 'pending',
      games_played: playerData.gamesPlayed || 0,
      phone: playerData.phone || '',
      email: playerData.email || '',
      rating_history: [],
      tournament_results: []
    };

    const { data, error } = await supabase
      .from('players')
      .insert([dbPlayerData])
      .select()
      .single();

    if (error) throw error;

    // Map the database response back to our application model
    return {
      id: data.id,
      name: data.name,
      rating: data.rating || FLOOR_RATING,
      gender: data.gender || 'M',
      state: data.state || '',
      city: data.city || '',
      status: data.status || 'pending',
      gamesPlayed: data.games_played || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: data.rating_history || [],
      tournamentResults: data.tournament_results || [],
      rapidRating: data.rapid_rating || FLOOR_RATING,
      blitzRating: data.blitz_rating || FLOOR_RATING,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: data.rating_status || 'provisional',
      rapidRatingStatus: data.rapid_rating_status || 'provisional',
      blitzRatingStatus: data.blitz_rating_status || 'provisional'
    };
  } catch (error) {
    console.error("Error creating player in Supabase:", error);
    return null;
  }
};

export const updatePlayerInSupabase = async (playerId: string, playerData: Partial<Player>): Promise<Player | null> => {
  try {
    // Map application model fields to database fields for the update
    const dbPlayerData: Record<string, any> = {};
    
    if (playerData.name !== undefined) dbPlayerData.name = playerData.name;
    if (playerData.rating !== undefined) dbPlayerData.rating = playerData.rating;
    if (playerData.gender !== undefined) dbPlayerData.gender = playerData.gender;
    if (playerData.state !== undefined) dbPlayerData.state = playerData.state;
    if (playerData.city !== undefined) dbPlayerData.city = playerData.city;
    if (playerData.status !== undefined) dbPlayerData.status = playerData.status;
    if (playerData.gamesPlayed !== undefined) dbPlayerData.games_played = playerData.gamesPlayed;
    if (playerData.phone !== undefined) dbPlayerData.phone = playerData.phone;
    if (playerData.email !== undefined) dbPlayerData.email = playerData.email;
    if (playerData.ratingHistory !== undefined) dbPlayerData.rating_history = playerData.ratingHistory;
    if (playerData.tournamentResults !== undefined) dbPlayerData.tournament_results = playerData.tournamentResults;
    
    // Additional fields
    if (playerData.rapidRating !== undefined) dbPlayerData.rapid_rating = playerData.rapidRating;
    if (playerData.blitzRating !== undefined) dbPlayerData.blitz_rating = playerData.blitzRating;
    if (playerData.rapidGamesPlayed !== undefined) dbPlayerData.rapid_games_played = playerData.rapidGamesPlayed;
    if (playerData.blitzGamesPlayed !== undefined) dbPlayerData.blitz_games_played = playerData.blitzGamesPlayed;
    if (playerData.ratingStatus !== undefined) dbPlayerData.rating_status = playerData.ratingStatus;
    if (playerData.rapidRatingStatus !== undefined) dbPlayerData.rapid_rating_status = playerData.rapidRatingStatus;
    if (playerData.blitzRatingStatus !== undefined) dbPlayerData.blitz_rating_status = playerData.blitzRatingStatus;

    const { data, error } = await supabase
      .from('players')
      .update(dbPlayerData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) throw error;

    // Map back to application model
    return {
      id: data.id,
      name: data.name,
      rating: data.rating || FLOOR_RATING,
      gender: data.gender || 'M',
      state: data.state || '',
      city: data.city || '',
      status: data.status || 'pending',
      gamesPlayed: data.games_played || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: data.rating_history || [],
      tournamentResults: data.tournament_results || [],
      rapidRating: data.rapid_rating || FLOOR_RATING,
      blitzRating: data.blitz_rating || FLOOR_RATING,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: data.rating_status || 'provisional',
      rapidRatingStatus: data.rapid_rating_status || 'provisional',
      blitzRatingStatus: data.blitz_rating_status || 'provisional'
    };
  } catch (error) {
    console.error(`Error updating player ${playerId} in Supabase:`, error);
    return null;
  }
};
