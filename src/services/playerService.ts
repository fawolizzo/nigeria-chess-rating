
import { supabase } from '../integrations/supabase/client';
import { Player, User } from '../lib/mockData';
import { FLOOR_RATING } from '@/lib/ratingCalculation';

/**
 * Fetches all players from Supabase, with optional filters.
 * @param filters - Optional filters for status, searchQuery, and state.
 * @returns A promise that resolves to an array of Player objects.
 */
export const getAllPlayersFromSupabase = async (
  filters: { status?: string; searchQuery?: string; state?: string }
): Promise<Player[]> => {
  let query = supabase.from('players').select('*');

  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.searchQuery) {
    const searchQuery = `%${filters.searchQuery}%`;
    query = query.or(`name.ilike.${searchQuery},id.ilike.${searchQuery}`);
  }

  // Add sorting by rating in descending order
  query = query.order('rating', { ascending: false });

  try {
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching players from Supabase:', error);
      return [];
    }
    
    // Map database fields to Player type
    const players: Player[] = (data || []).map(dbPlayer => ({
      id: dbPlayer.id,
      name: dbPlayer.name,
      email: dbPlayer.email,
      phone: dbPlayer.phone || '',
      rating: dbPlayer.rating || FLOOR_RATING,
      fideId: dbPlayer.fide_id || undefined,
      gender: 'M' as 'M' | 'F', // Default value if not in database yet
      gamesPlayed: 0, // Default values if not in database yet
      status: 'approved', // Default to approved if not specified
      tournamentResults: [], // Empty arrays for history if not available
      ratingHistory: [],
      // Additional fields can be added as needed
      title: dbPlayer.title || undefined,
      birthYear: dbPlayer.birth_year || undefined,
      country: dbPlayer.country || 'Nigeria',
      state: dbPlayer.state || undefined,
      city: dbPlayer.city || undefined,
      club: dbPlayer.club || undefined,
      federationId: dbPlayer.federation_id || undefined,
      rapidRating: dbPlayer.rapid_rating || undefined,
      blitzRating: dbPlayer.blitz_rating || undefined,
      rapidGamesPlayed: dbPlayer.rapid_games_played || 0,
      blitzGamesPlayed: dbPlayer.blitz_games_played || 0,
      ratingStatus: dbPlayer.rating_status as 'provisional' | 'established' || 'provisional',
      rapidRatingStatus: dbPlayer.rapid_rating_status as 'provisional' | 'established' || 'provisional',
      blitzRatingStatus: dbPlayer.blitz_rating_status as 'provisional' | 'established' || 'provisional',
      achievements: dbPlayer.achievements || [],
      rapidRatingHistory: dbPlayer.rapid_rating_history || [],
      blitzRatingHistory: dbPlayer.blitz_rating_history || [],
      titleVerified: dbPlayer.title_verified || false
    }));
    
    return players;
  } catch (error) {
    console.error('Unexpected error fetching players:', error);
    return [];
  }
};

/**
 * Fetches a single player by ID from Supabase.
 * @param id - The ID of the player to fetch.
 * @returns A promise that resolves to a Player object or null if not found or an error occurs.
 */
export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching player with ID ${id} from Supabase:`, error);
      return null;
    }
    
    if (!data) return null;
    
    // Map database fields to Player type
    const player: Player = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      rating: data.rating || FLOOR_RATING,
      fideId: data.fide_id || undefined,
      gender: 'M' as 'M' | 'F', // Default value if not in database yet
      gamesPlayed: 0, // Default values if not in database yet
      status: 'approved', // Default to approved if not specified
      tournamentResults: [], // Empty arrays for history if not available
      ratingHistory: [],
      // Additional fields can be added as needed
      title: data.title || undefined,
      birthYear: data.birth_year || undefined,
      country: data.country || 'Nigeria',
      state: data.state || undefined,
      city: data.city || undefined,
      club: data.club || undefined,
      federationId: data.federation_id || undefined,
      rapidRating: data.rapid_rating || undefined,
      blitzRating: data.blitz_rating || undefined,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: data.rating_status as 'provisional' | 'established' || 'provisional',
      rapidRatingStatus: data.rapid_rating_status as 'provisional' | 'established' || 'provisional',
      blitzRatingStatus: data.blitz_rating_status as 'provisional' | 'established' || 'provisional',
      achievements: data.achievements || [],
      rapidRatingHistory: data.rapid_rating_history || [],
      blitzRatingHistory: data.blitz_rating_history || [],
      titleVerified: data.title_verified || false
    };
    
    return player;
  } catch (error) {
    console.error(`Unexpected error fetching player with ID ${id}:`, error);
    return null;
  }
};

/**
 * Fetches users from Supabase, with optional filters.
 * @param filters - Optional filters for role and status.
 * @returns A promise that resolves to an array of User objects.
 */
export const getUsersFromSupabase = async (
  filters?: { role?: string; status?: string }
): Promise<User[]> => {
  // Adjust table name to 'organizers' based on your schema
  let query = supabase.from('organizers').select('*');

  if (filters?.role) {
    query = query.eq('role', filters.role);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  try {
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching users from Supabase:', error);
      return [];
    }
    
    // Map database fields to User type
    const users: User[] = (data || []).map(dbUser => ({
      id: dbUser.id,
      fullName: dbUser.name,
      email: dbUser.email,
      phoneNumber: dbUser.phone || '',
      state: dbUser.state || '',
      role: dbUser.role as 'tournament_organizer' | 'rating_officer',
      status: dbUser.status as 'pending' | 'approved' | 'rejected',
      registrationDate: dbUser.created_at,
      approvalDate: dbUser.approval_date
    }));
    
    return users;
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return [];
  }
};

/**
 * Creates a new player in Supabase.
 * @param playerData - The data for the new player.
 * @returns A promise that resolves to the created Player object or null if an error occurs.
 */
export const createPlayerInSupabase = async (
  playerData: Omit<Player, 'id' | 'ratingHistory' | 'tournamentResults'>
): Promise<Player | null> => {
  try {
    // Convert Player object to database format
    const dbPlayerData = {
      name: playerData.name,
      email: playerData.email,
      phone: playerData.phone || null,
      rating: playerData.rating || FLOOR_RATING,
      fide_id: playerData.fideId || null,
      gender: playerData.gender || 'M',
      birth_year: playerData.birthYear || null,
      country: playerData.country || 'Nigeria',
      state: playerData.state || null,
      city: playerData.city || null,
      club: playerData.club || null,
      federation_id: playerData.federationId || null,
      games_played: playerData.gamesPlayed || 0,
      rapid_rating: playerData.rapidRating || null,
      blitz_rating: playerData.blitzRating || null,
      rapid_games_played: playerData.rapidGamesPlayed || 0,
      blitz_games_played: playerData.blitzGamesPlayed || 0,
      rating_status: playerData.ratingStatus || 'provisional',
      rapid_rating_status: playerData.rapidRatingStatus || 'provisional',
      blitz_rating_status: playerData.blitzRatingStatus || 'provisional',
      achievements: playerData.achievements || [],
      status: playerData.status || 'pending',
      title: playerData.title || null,
      title_verified: playerData.titleVerified || false
    };

    const { data, error } = await supabase
      .from('players')
      .insert([dbPlayerData])
      .select()
      .single();

    if (error) {
      console.error('Error creating player in Supabase:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Map database response back to Player type
    const player: Player = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      rating: data.rating || FLOOR_RATING,
      gender: data.gender as 'M' | 'F' || 'M',
      gamesPlayed: data.games_played || 0,
      status: data.status as 'pending' | 'approved' | 'rejected',
      tournamentResults: [],
      ratingHistory: [],
      fideId: data.fide_id || undefined,
      birthYear: data.birth_year || undefined,
      country: data.country || 'Nigeria',
      state: data.state || undefined,
      city: data.city || undefined,
      club: data.club || undefined,
      federationId: data.federation_id || undefined,
      rapidRating: data.rapid_rating || undefined,
      blitzRating: data.blitz_rating || undefined,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: data.rating_status as 'provisional' | 'established' || 'provisional',
      rapidRatingStatus: data.rapid_rating_status as 'provisional' | 'established' || 'provisional',
      blitzRatingStatus: data.blitz_rating_status as 'provisional' | 'established' || 'provisional',
      achievements: data.achievements || [],
      rapidRatingHistory: [],
      blitzRatingHistory: [],
      titleVerified: data.title_verified || false
    };
    
    return player;
  } catch (error) {
    console.error('Unexpected error creating player:', error);
    return null;
  }
};

/**
 * Updates an existing player in Supabase.
 * @param playerId - The ID of the player to update.
 * @param playerData - An object containing the player fields to update.
 * @returns A promise that resolves to the updated Player object or null if an error occurs.
 */
export const updatePlayerInSupabase = async (
  playerId: string,
  playerData: Partial<Player>
): Promise<Player | null> => {
  try {
    // Convert Player object fields to database format
    const dbPlayerData: Record<string, any> = {};
    
    // Map each field to its database counterpart
    if (playerData.name !== undefined) dbPlayerData.name = playerData.name;
    if (playerData.email !== undefined) dbPlayerData.email = playerData.email;
    if (playerData.phone !== undefined) dbPlayerData.phone = playerData.phone;
    if (playerData.rating !== undefined) dbPlayerData.rating = playerData.rating;
    if (playerData.fideId !== undefined) dbPlayerData.fide_id = playerData.fideId;
    if (playerData.gender !== undefined) dbPlayerData.gender = playerData.gender;
    if (playerData.birthYear !== undefined) dbPlayerData.birth_year = playerData.birthYear;
    if (playerData.country !== undefined) dbPlayerData.country = playerData.country;
    if (playerData.state !== undefined) dbPlayerData.state = playerData.state;
    if (playerData.city !== undefined) dbPlayerData.city = playerData.city;
    if (playerData.club !== undefined) dbPlayerData.club = playerData.club;
    if (playerData.federationId !== undefined) dbPlayerData.federation_id = playerData.federationId;
    if (playerData.gamesPlayed !== undefined) dbPlayerData.games_played = playerData.gamesPlayed;
    if (playerData.rapidRating !== undefined) dbPlayerData.rapid_rating = playerData.rapidRating;
    if (playerData.blitzRating !== undefined) dbPlayerData.blitz_rating = playerData.blitzRating;
    if (playerData.rapidGamesPlayed !== undefined) dbPlayerData.rapid_games_played = playerData.rapidGamesPlayed;
    if (playerData.blitzGamesPlayed !== undefined) dbPlayerData.blitz_games_played = playerData.blitzGamesPlayed;
    if (playerData.ratingStatus !== undefined) dbPlayerData.rating_status = playerData.ratingStatus;
    if (playerData.rapidRatingStatus !== undefined) dbPlayerData.rapid_rating_status = playerData.rapidRatingStatus;
    if (playerData.blitzRatingStatus !== undefined) dbPlayerData.blitz_rating_status = playerData.blitzRatingStatus;
    if (playerData.achievements !== undefined) dbPlayerData.achievements = playerData.achievements;
    if (playerData.status !== undefined) dbPlayerData.status = playerData.status;
    if (playerData.tournamentResults !== undefined) dbPlayerData.tournament_results = playerData.tournamentResults;
    if (playerData.ratingHistory !== undefined) dbPlayerData.rating_history = playerData.ratingHistory;
    if (playerData.rapidRatingHistory !== undefined) dbPlayerData.rapid_rating_history = playerData.rapidRatingHistory;
    if (playerData.blitzRatingHistory !== undefined) dbPlayerData.blitz_rating_history = playerData.blitzRatingHistory;
    if (playerData.title !== undefined) dbPlayerData.title = playerData.title;
    if (playerData.titleVerified !== undefined) dbPlayerData.title_verified = playerData.titleVerified;

    const { data, error } = await supabase
      .from('players')
      .update(dbPlayerData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating player with ID ${playerId} in Supabase:`, error);
      return null;
    }
    
    if (!data) return null;
    
    // Map database response back to Player type
    const player: Player = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      rating: data.rating || FLOOR_RATING,
      gender: data.gender as 'M' | 'F' || 'M',
      gamesPlayed: data.games_played || 0,
      status: data.status as 'pending' | 'approved' | 'rejected',
      tournamentResults: data.tournament_results || [],
      ratingHistory: data.rating_history || [],
      fideId: data.fide_id || undefined,
      birthYear: data.birth_year || undefined,
      country: data.country || 'Nigeria',
      state: data.state || undefined,
      city: data.city || undefined,
      club: data.club || undefined,
      federationId: data.federation_id || undefined,
      rapidRating: data.rapid_rating || undefined,
      blitzRating: data.blitz_rating || undefined,
      rapidGamesPlayed: data.rapid_games_played || 0,
      blitzGamesPlayed: data.blitz_games_played || 0,
      ratingStatus: data.rating_status as 'provisional' | 'established' || 'provisional',
      rapidRatingStatus: data.rapid_rating_status as 'provisional' | 'established' || 'provisional',
      blitzRatingStatus: data.blitz_rating_status as 'provisional' | 'established' || 'provisional',
      achievements: data.achievements || [],
      rapidRatingHistory: data.rapid_rating_history || [],
      blitzRatingHistory: data.blitz_rating_history || [],
      titleVerified: data.title_verified || false
    };
    
    return player;
  } catch (error) {
    console.error(`Unexpected error updating player with ID ${playerId}:`, error);
    return null;
  }
};
