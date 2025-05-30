import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/lib/mockData";
import { FLOOR_RATING } from "@/lib/ratingCalculation";

interface PlayerFilter {
  state?: string;
  city?: string;
  name?: string;
  status?: string;
}

export const getAllPlayersFromSupabase = async (filters: PlayerFilter = {}): Promise<Player[]> => {
  try {
    console.log("Fetching players from Supabase with filters:", filters);
    let query = supabase.from('players').select('*');
    
    // Apply filters if provided
    if (filters.state) query = query.eq('state', filters.state);
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.name) query = query.ilike('name', `%${filters.name}%`);
    if (filters.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Raw player data from Supabase:", data);
    
    // Map database fields to our application model
    const mappedPlayers = (data || []).map(player => {
      const mappedPlayer: Player = {
        id: player.id,
        name: player.name || '',
        rating: player.rating || FLOOR_RATING,
        gender: (player.gender as "M" | "F") || 'M',
        state: player.state || '',
        city: player.city || '',
        country: 'Nigeria',
        status: (player.status as "pending" | "approved" | "rejected") || 'approved',
        gamesPlayed: player.games_played || 0,
        phone: player.phone || '',
        email: player.email || '',
        ratingHistory: [],
        tournamentResults: [],
        rapidRating: player.rapid_rating || FLOOR_RATING,
        blitzRating: player.blitz_rating || FLOOR_RATING,
        rapidGamesPlayed: player.rapid_games_played || 0,
        blitzGamesPlayed: player.blitz_games_played || 0,
        ratingStatus: (player.games_played || 0) >= 30 ? 'established' : 'provisional' as const,
        rapidRatingStatus: (player.rapid_games_played || 0) >= 30 ? 'established' : 'provisional' as const,
        blitzRatingStatus: (player.blitz_games_played || 0) >= 30 ? 'established' : 'provisional' as const,
        rapidRatingHistory: [],
        blitzRatingHistory: [],
        title: player.title || undefined,
        titleVerified: player.title_verified || false,
        birthYear: player.birth_year || undefined,
        club: player.club || undefined,
        fideId: player.fide_id || undefined
      };
      return mappedPlayer;
    });
    
    console.log("Mapped players:", mappedPlayers);
    return mappedPlayers;
  } catch (error) {
    console.error("Error getting players from Supabase:", error);
    return [];
  }
};

export const getPlayerByIdFromSupabase = async (playerId: string): Promise<Player | null> => {
  try {
    console.log("Fetching player by ID from Supabase:", playerId);
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();
    
    if (error) {
      console.error("Supabase error for player ID:", playerId, error);
      throw error;
    }
    if (!data) {
      console.log("No player found with ID:", playerId);
      return null;
    }
    
    console.log("Raw player data from Supabase:", data);
    
    const mappedPlayer: Player = {
      id: data.id,
      name: data.name || '',
      rating: data.rating || FLOOR_RATING,
      gender: (data.gender as "M" | "F") || 'M',
      state: data.state || '',
      city: data.city || '',
      country: 'Nigeria',
      status: (data.status as "pending" | "approved" | "rejected") || 'approved',
      gamesPlayed: data.games_played || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: [],
      tournamentResults: [],
      rapidRating: data.rapid_rating || FLOOR_RATING,
      blitzRating: data.blitz_rating || FLOOR_RATING,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: (data.games_played || 0) >= 30 ? 'established' : 'provisional',
      rapidRatingStatus: (data.rapid_games_played || 0) >= 30 ? 'established' : 'provisional',
      blitzRatingStatus: (data.blitz_games_played || 0) >= 30 ? 'established' : 'provisional',
      rapidRatingHistory: [],
      blitzRatingHistory: [],
      title: data.title || undefined,
      titleVerified: data.title_verified || false,
      birthYear: data.birth_year || undefined,
      club: data.club || undefined,
      fideId: data.fide_id || undefined
    };
    
    console.log("Mapped player:", mappedPlayer);
    return mappedPlayer;
  } catch (error) {
    console.error(`Error getting player ${playerId} from Supabase:`, error);
    return null;
  }
};

export const getAllUsers = async (): Promise<any[]> => {
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
      email: playerData.email || '',
      state: playerData.state || '',
      city: playerData.city || '',
      status: playerData.status || 'pending',
      games_played: playerData.gamesPlayed || 0,
      gender: playerData.gender || 'M',
      rapid_rating: playerData.rapidRating || FLOOR_RATING,
      blitz_rating: playerData.blitzRating || FLOOR_RATING,
      rapid_games_played: playerData.rapidGamesPlayed || 0,
      blitz_games_played: playerData.blitzGamesPlayed || 0,
      title: playerData.title || null,
      title_verified: playerData.titleVerified || false,
      birth_year: playerData.birthYear || null,
      club: playerData.club || null,
      fide_id: playerData.fideId || null
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
      gender: (data.gender as "M" | "F") || 'M',
      state: data.state || '',
      city: data.city || '',
      country: 'Nigeria',
      status: (data.status as "pending" | "approved" | "rejected") || 'pending',
      gamesPlayed: data.games_played || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: [],
      tournamentResults: [],
      rapidRating: data.rapid_rating || FLOOR_RATING,
      blitzRating: data.blitz_rating || FLOOR_RATING,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: 'provisional',
      rapidRatingStatus: 'provisional',
      blitzRatingStatus: 'provisional',
      rapidRatingHistory: [],
      blitzRatingHistory: [],
      title: data.title || undefined,
      titleVerified: data.title_verified || false,
      birthYear: data.birth_year || undefined,
      club: data.club || undefined,
      fideId: data.fide_id || undefined
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
    if (playerData.state !== undefined) dbPlayerData.state = playerData.state;
    if (playerData.city !== undefined) dbPlayerData.city = playerData.city;
    if (playerData.status !== undefined) dbPlayerData.status = playerData.status;
    if (playerData.gamesPlayed !== undefined) dbPlayerData.games_played = playerData.gamesPlayed;
    if (playerData.gender !== undefined) dbPlayerData.gender = playerData.gender;
    if (playerData.rapidRating !== undefined) dbPlayerData.rapid_rating = playerData.rapidRating;
    if (playerData.blitzRating !== undefined) dbPlayerData.blitz_rating = playerData.blitzRating;
    if (playerData.rapidGamesPlayed !== undefined) dbPlayerData.rapid_games_played = playerData.rapidGamesPlayed;
    if (playerData.blitzGamesPlayed !== undefined) dbPlayerData.blitz_games_played = playerData.blitzGamesPlayed;
    if (playerData.title !== undefined) dbPlayerData.title = playerData.title;
    if (playerData.titleVerified !== undefined) dbPlayerData.title_verified = playerData.titleVerified;
    if (playerData.birthYear !== undefined) dbPlayerData.birth_year = playerData.birthYear;
    if (playerData.club !== undefined) dbPlayerData.club = playerData.club;
    if (playerData.fideId !== undefined) dbPlayerData.fide_id = playerData.fideId;

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
      gender: (data.gender as "M" | "F") || 'M',
      state: data.state || '',
      city: data.city || '',
      country: 'Nigeria',
      status: (data.status as "pending" | "approved" | "rejected") || 'approved',
      gamesPlayed: data.games_played || 0,
      phone: data.phone || '',
      email: data.email || '',
      ratingHistory: playerData.ratingHistory || [],
      tournamentResults: playerData.tournamentResults || [],
      rapidRating: data.rapid_rating || FLOOR_RATING,
      blitzRating: data.blitz_rating || FLOOR_RATING,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: (data.games_played || 0) >= 30 ? 'established' : 'provisional',
      rapidRatingStatus: (data.rapid_games_played || 0) >= 30 ? 'established' : 'provisional',
      blitzRatingStatus: (data.blitz_games_played || 0) >= 30 ? 'established' : 'provisional',
      rapidRatingHistory: playerData.rapidRatingHistory || [],
      blitzRatingHistory: playerData.blitzRatingHistory || [],
      title: data.title || undefined,
      titleVerified: data.title_verified || false,
      birthYear: data.birth_year || undefined,
      club: data.club || undefined,
      fideId: data.fide_id || undefined
    };
  } catch (error) {
    console.error(`Error updating player ${playerId} in Supabase:`, error);
    return null;
  }
};
