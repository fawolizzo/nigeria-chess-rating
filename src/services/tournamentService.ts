
import { supabase } from '../integrations/supabase/client';
import { Tournament } from '../lib/mockData';

/**
 * Fetches all tournaments from Supabase, with optional filters.
 * @param filters - Optional filters for searchQuery (name, location, city) and state.
 * @returns A promise that resolves to an array of Tournament objects.
 */
export const getAllTournamentsFromSupabase = async (
  filters: { searchQuery?: string; state?: string; organizerId?: string }
): Promise<Tournament[]> => {
  let query = supabase.from('tournaments').select('*');

  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  
  if (filters.organizerId) {
    query = query.eq('organizer_id', filters.organizerId);
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
    
    // Map database fields to Tournament type
    const tournaments: Tournament[] = (data || []).map(dbTournament => ({
      id: dbTournament.id,
      name: dbTournament.name,
      startDate: dbTournament.start_date,
      endDate: dbTournament.end_date,
      location: dbTournament.location,
      state: dbTournament.state || undefined,
      city: dbTournament.city || undefined,
      organizerId: dbTournament.organizer_id,
      status: dbTournament.status as Tournament['status'],
      players: dbTournament.players || [],
      rounds: dbTournament.rounds || 0,
      currentRound: dbTournament.current_round || 1,
      category: dbTournament.category as 'classical' | 'rapid' | 'blitz' || 'classical',
      timeControl: dbTournament.time_control || '',
      pairings: dbTournament.pairings || [],
      standings: dbTournament.standings || [],
      processingDate: dbTournament.processing_date,
      processedPlayerIds: dbTournament.processed_player_ids,
      prize: dbTournament.prize || undefined,
      rejectionReason: dbTournament.rejection_reason || undefined,
      participants: dbTournament.participants || '0',
      description: dbTournament.description || undefined,
      registrationOpen: dbTournament.registration_open || false
    }));
    
    return tournaments;
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
    
    if (!data) return null;
    
    // Map database fields to Tournament type
    const tournament: Tournament = {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      state: data.state || undefined,
      city: data.city || undefined,
      organizerId: data.organizer_id,
      status: data.status as Tournament['status'],
      players: data.players || [],
      rounds: data.rounds || 0,
      currentRound: data.current_round || 1,
      category: data.category as 'classical' | 'rapid' | 'blitz' || 'classical',
      timeControl: data.time_control || '',
      pairings: data.pairings || [],
      standings: data.standings || [],
      processingDate: data.processing_date,
      processedPlayerIds: data.processed_player_ids,
      prize: data.prize || undefined,
      rejectionReason: data.rejection_reason || undefined,
      participants: data.participants || '0',
      description: data.description || undefined,
      registrationOpen: data.registration_open || false
    };
    
    return tournament;
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
export const addTournamentToSupabase = async (
  tournamentData: Omit<Tournament, 'id'>
): Promise<Tournament | null> => {
  // This is just an alias for the createTournamentInSupabase function for backward compatibility
  return createTournamentInSupabase(tournamentData);
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
    // Convert Tournament object to database format
    const dbTournamentData = {
      name: tournamentData.name,
      start_date: tournamentData.startDate,
      end_date: tournamentData.endDate,
      location: tournamentData.location,
      state: tournamentData.state || null,
      city: tournamentData.city || null,
      organizer_id: tournamentData.organizerId,
      status: tournamentData.status || 'upcoming',
      players: tournamentData.players || [],
      rounds: tournamentData.rounds || 1,
      current_round: tournamentData.currentRound || 1,
      category: tournamentData.category || 'classical',
      time_control: tournamentData.timeControl || '',
      pairings: tournamentData.pairings || [],
      standings: tournamentData.standings || [],
      processing_date: tournamentData.processingDate || null,
      processed_player_ids: tournamentData.processedPlayerIds || [],
      prize: tournamentData.prize || null,
      rejection_reason: tournamentData.rejectionReason || null,
      participants: tournamentData.participants || '0',
      description: tournamentData.description || null,
      registration_open: tournamentData.registrationOpen || false
    };

    const { data, error } = await supabase
      .from('tournaments')
      .insert([dbTournamentData])
      .select()
      .single();

    if (error) {
      console.error('Error creating tournament in Supabase:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Map database response back to Tournament type
    const tournament: Tournament = {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      state: data.state || undefined,
      city: data.city || undefined,
      organizerId: data.organizer_id,
      status: data.status as Tournament['status'],
      players: data.players || [],
      rounds: data.rounds || 0,
      currentRound: data.current_round || 1,
      category: data.category as 'classical' | 'rapid' | 'blitz' || 'classical',
      timeControl: data.time_control || '',
      pairings: data.pairings || [],
      standings: data.standings || [],
      processingDate: data.processing_date,
      processedPlayerIds: data.processed_player_ids,
      prize: data.prize || undefined,
      rejectionReason: data.rejection_reason || undefined,
      participants: data.participants || '0',
      description: data.description || undefined,
      registrationOpen: data.registration_open || false
    };
    
    return tournament;
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
    // Convert Tournament object fields to database format
    const dbTournamentData: Record<string, any> = {};
    
    // Map each field to its database counterpart
    if (tournamentData.name !== undefined) dbTournamentData.name = tournamentData.name;
    if (tournamentData.startDate !== undefined) dbTournamentData.start_date = tournamentData.startDate;
    if (tournamentData.endDate !== undefined) dbTournamentData.end_date = tournamentData.endDate;
    if (tournamentData.location !== undefined) dbTournamentData.location = tournamentData.location;
    if (tournamentData.state !== undefined) dbTournamentData.state = tournamentData.state;
    if (tournamentData.city !== undefined) dbTournamentData.city = tournamentData.city;
    if (tournamentData.organizerId !== undefined) dbTournamentData.organizer_id = tournamentData.organizerId;
    if (tournamentData.status !== undefined) dbTournamentData.status = tournamentData.status;
    if (tournamentData.players !== undefined) dbTournamentData.players = tournamentData.players;
    if (tournamentData.rounds !== undefined) dbTournamentData.rounds = tournamentData.rounds;
    if (tournamentData.currentRound !== undefined) dbTournamentData.current_round = tournamentData.currentRound;
    if (tournamentData.category !== undefined) dbTournamentData.category = tournamentData.category;
    if (tournamentData.timeControl !== undefined) dbTournamentData.time_control = tournamentData.timeControl;
    if (tournamentData.pairings !== undefined) dbTournamentData.pairings = tournamentData.pairings;
    if (tournamentData.standings !== undefined) dbTournamentData.standings = tournamentData.standings;
    if (tournamentData.processingDate !== undefined) dbTournamentData.processing_date = tournamentData.processingDate;
    if (tournamentData.processedPlayerIds !== undefined) dbTournamentData.processed_player_ids = tournamentData.processedPlayerIds;
    if (tournamentData.prize !== undefined) dbTournamentData.prize = tournamentData.prize;
    if (tournamentData.rejectionReason !== undefined) dbTournamentData.rejection_reason = tournamentData.rejectionReason;
    if (tournamentData.participants !== undefined) dbTournamentData.participants = tournamentData.participants;
    if (tournamentData.description !== undefined) dbTournamentData.description = tournamentData.description;
    if (tournamentData.registrationOpen !== undefined) dbTournamentData.registration_open = tournamentData.registrationOpen;

    const { data, error } = await supabase
      .from('tournaments')
      .update(dbTournamentData)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating tournament with ID ${tournamentId} in Supabase:`, error);
      return null;
    }
    
    if (!data) return null;
    
    // Map database response back to Tournament type
    const tournament: Tournament = {
      id: data.id,
      name: data.name,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      state: data.state || undefined,
      city: data.city || undefined,
      organizerId: data.organizer_id,
      status: data.status as Tournament['status'],
      players: data.players || [],
      rounds: data.rounds || 0,
      currentRound: data.current_round || 1,
      category: data.category as 'classical' | 'rapid' | 'blitz' || 'classical',
      timeControl: data.time_control || '',
      pairings: data.pairings || [],
      standings: data.standings || [],
      processingDate: data.processing_date,
      processedPlayerIds: data.processed_player_ids,
      prize: data.prize || undefined,
      rejectionReason: data.rejection_reason || undefined,
      participants: data.participants || '0',
      description: data.description || undefined,
      registrationOpen: data.registration_open || false
    };
    
    return tournament;
  } catch (error) {
    console.error(`Unexpected error updating tournament with ID ${tournamentId}:`, error);
    return null;
  }
};
