import { supabase } from '../integrations/supabase/client';
import { Tournament } from '../lib/mockData';

/**
 * Fetches all tournaments from Supabase, with optional filters.
 * @param filters - Optional filters for searchQuery (name, location, city) and state.
 * @returns A promise that resolves to an array of Tournament objects.
 */
export const getAllTournamentsFromSupabase = async (
  filters: { searchQuery?: string; state?: string }
): Promise<Tournament[]> => {
  let query = supabase.from('tournaments').select('*');

  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.searchQuery) {
    const searchQuery = `%${filters.searchQuery}%`;
    query = query.or(`name.ilike.${searchQuery},location.ilike.${searchQuery},city.ilike.${searchQuery}`);
  }

  try {
    const { data, error } = await query;
    if (error) {
      console.error('Error fetching tournaments from Supabase:', error);
      return [];
    }
    return data as Tournament[];
  } catch (error) {
    console.error('Unexpected error fetching tournaments:', error);
    return [];
  }
};

/**
 * Fetches a single tournament by ID from Supabase.
 * @param id - The ID of the tournament to fetch.
 * @returns A promise that resolves to a Tournament object or null if not found or an error occurs.
 */
export const getTournamentByIdFromSupabase = async (id: string): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`Error fetching tournament with ID ${id} from Supabase:`, error);
      return null;
    }
    return data as Tournament | null;
  } catch (error) {
    console.error(`Unexpected error fetching tournament with ID ${id}:`, error);
    return null;
  }
};

/**
 * Creates a new tournament in Supabase.
 * @param tournamentData - The data for the new tournament (excluding id).
 * @returns A promise that resolves to the created Tournament object or null if an error occurs.
 */
export const createTournamentInSupabase = async (
  tournamentData: Omit<Tournament, 'id'>
): Promise<Tournament | null> => {
  try {
    // We are omitting 'id' as Supabase should generate it.
    // For complex fields like players, rounds, pairings, standings,
    // this initial function assumes they are either not set on creation
    // or are simple enough to be included directly if the table schema allows.
    // Typically, these might be handled in separate update steps or dedicated functions.
    const { data, error } = await supabase
      .from('tournaments')
      .insert([tournamentData]) // insert expects an array of objects
      .select()
      .single(); // Assuming insert returns the created record

    if (error) {
      console.error('Error creating tournament in Supabase:', error);
      return null;
    }
    return data as Tournament | null;
  } catch (error) {
    console.error('Unexpected error creating tournament:', error);
    return null;
  }
};

/**
 * Updates an existing tournament in Supabase.
 * @param tournamentId - The ID of the tournament to update.
 * @param tournamentData - An object containing the tournament fields to update.
 * @returns A promise that resolves to the updated Tournament object or null if an error occurs.
 */
export const updateTournamentInSupabase = async (
  tournamentId: string,
  tournamentData: Partial<Tournament>
): Promise<Tournament | null> => {
  try {
    // This function will primarily update simple, top-level fields.
    // Updating complex JSONB fields like 'players', 'rounds', 'pairings', 'standings'
    // might require specific strategies (e.g., fetching then merging, or using Supabase JSON functions)
    // which are beyond the scope of this initial implementation.
    const { data, error } = await supabase
      .from('tournaments')
      .update(tournamentData)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tournament with ID ${tournamentId} in Supabase:`, error);
      return null;
    }
    return data as Tournament | null;
  } catch (error) {
    console.error(`Unexpected error updating tournament with ID ${tournamentId}:`, error);
    return null;
  }
};
