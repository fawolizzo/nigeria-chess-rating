import { supabase } from '../integrations/supabase/client';
import { Player, User } from '../lib/mockData'; // Added User import

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
    return data as Player[];
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
    return data as Player | null;
  } catch (error) {
    console.error(`Unexpected error fetching player with ID ${id}:`, error);
    return null;
  }
};

/**
 * Fetches users from Supabase, with optional filters.
 * Assumes a 'profiles' table or a similar table storing user information including roles.
 * @param filters - Optional filters for role and status.
 * @returns A promise that resolves to an array of User objects.
 */
export const getUsersFromSupabase = async (
  filters?: { role?: string; status?: string }
): Promise<User[]> => {
  // Adjust table name if your user profiles table is different (e.g., 'users', 'auth_users_with_metadata')
  let query = supabase.from('profiles').select(`
    id,
    fullName:full_name, 
    email,
    phoneNumber:phone_number,
    state,
    role,
    status,
    registrationDate:registration_date,
    approvalDate:approval_date
  `);
  // Note: Supabase typically uses snake_case for column names.
  // The select string above maps snake_case columns to camelCase fields in the User type.
  // If your Supabase table uses camelCase directly, you can simplify the select to just '*'.

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
    return data as User[];
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
    // Supabase typically generates the ID if the column is set up as a primary key with a default (e.g., UUID)
    // For now, we assume `playerData` does not include `id`.
    // `ratingHistory` and `tournamentResults` are omitted as per requirements.
    const { data, error } = await supabase
      .from('players')
      .insert([playerData]) // insert expects an array of objects
      .select()
      .single(); // Assuming insert returns the created record

    if (error) {
      console.error('Error creating player in Supabase:', error);
      return null;
    }
    return data as Player | null;
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
    const { data, error } = await supabase
      .from('players')
      .update(playerData)
      .eq('id', playerId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating player with ID ${playerId} in Supabase:`, error);
      return null;
    }
    return data as Player | null;
  } catch (error) {
    console.error(`Unexpected error updating player with ID ${playerId}:`, error);
    return null;
  }
};
