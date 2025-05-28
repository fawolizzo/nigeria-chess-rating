
import { supabase } from "@/integrations/supabase/client";
import { Tournament } from "@/lib/mockData";

interface TournamentFilters {
  organizerId?: string;
  // Add other potential filter properties here
}

export const getTournamentsFromSupabase = async (filters: TournamentFilters = {}): Promise<Tournament[]> => {
  try {
    let query = supabase.from('tournaments').select('*');

    // Apply filters
    if (filters.organizerId) {
      query = query.eq('organizer_id', filters.organizerId);
    }
    // Add other filters here, e.g.:
    // if (filters.status) {
    //   query = query.eq('status', filters.status);
    // }

    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      organizer: tournament.organizer_id, // Map organizer_id to organizer
      organizerId: tournament.organizer_id,
      date: tournament.start_date,
      location: tournament.location,
      city: tournament.city,
      state: tournament.state,
      status: tournament.status as "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed",
      players: [], // Default empty array since not in DB
      totalRounds: tournament.rounds,
      currentRound: 1, // Default since not in DB
      category: 'Open', // Default since not in DB
      timeControl: tournament.time_control,
      description: tournament.description,
      pairings: [], // Default since not in DB
      standings: [], // Default since not in DB
      processingDate: tournament.updated_at // Map updated_at to processingDate
    }));
  } catch (error) {
    console.error("Error getting tournaments from Supabase:", error);
    return [];
  }
};

export const createTournamentInSupabase = async (tournamentData: any): Promise<Tournament | null> => {
  try {
    const dbTournamentData = {
      name: tournamentData.name,
      organizer_id: tournamentData.organizerId,
      start_date: tournamentData.date,
      location: tournamentData.location,
      city: tournamentData.city,
      state: tournamentData.state,
      status: tournamentData.status || 'pending',
      rounds: tournamentData.totalRounds,
      time_control: tournamentData.timeControl,
      description: tournamentData.description || ''
    };

    const { data, error } = await supabase
      .from('tournaments')
      .insert([dbTournamentData])
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      organizer: data.organizer_id,
      organizerId: data.organizer_id,
      date: data.start_date,
      location: data.location,
      city: data.city,
      state: data.state,
      status: data.status as "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed",
      players: [],
      totalRounds: data.rounds,
      currentRound: 1,
      category: 'Open',
      timeControl: data.time_control,
      description: data.description,
      pairings: [],
      standings: []
    };
  } catch (error) {
    console.error("Error creating tournament in Supabase:", error);
    return null;
  }
};

export const updateTournamentInSupabase = async (tournamentId: string, updates: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    // Map application field names to database column names if necessary
    const dbUpdates: Record<string, any> = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.date !== undefined) dbUpdates.start_date = updates.date; // Assuming 'date' maps to 'start_date'
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.players !== undefined) dbUpdates.players = updates.players; // Assuming 'players' is an array of IDs
    if (updates.totalRounds !== undefined) dbUpdates.rounds = updates.totalRounds;
    if (updates.currentRound !== undefined) dbUpdates.current_round = updates.currentRound;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.timeControl !== undefined) dbUpdates.time_control = updates.timeControl;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.pairings !== undefined) dbUpdates.pairings = updates.pairings; // Assuming 'pairings' is JSON or similar
    if (updates.standings !== undefined) dbUpdates.standings = updates.standings; // Assuming 'standings' is JSON or similar
    if (updates.hostId !== undefined) dbUpdates.host_id = updates.hostId;
    if (updates.registrationOpen !== undefined) dbUpdates.registration_open = updates.registrationOpen;
    // Add any other fields that need mapping

    // Ensure 'updated_at' is automatically handled by Supabase or set manually if needed
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tournaments')
      .update(dbUpdates)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;

    // Map database response back to Tournament type
    return {
      id: data.id,
      name: data.name,
      organizer: data.organizer_id,
      organizerId: data.organizer_id,
      date: data.start_date,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      city: data.city,
      state: data.state,
      status: data.status,
      players: data.players || [],
      totalRounds: data.rounds,
      currentRound: data.current_round || 1,
      category: data.category || 'Open',
      timeControl: data.time_control,
      description: data.description,
      pairings: data.pairings || [],
      standings: data.standings || [],
      processingDate: data.updated_at,
      hostId: data.host_id,
      registrationOpen: data.registration_open,
    };
  } catch (error) {
    console.error(`Error updating tournament ${tournamentId} in Supabase:`, error);
    return null;
  }
};

export const getTournamentByIdFromSupabase = async (tournamentId: string): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) {
      // Log the error but don't throw if it's a "not found" error, which single() might return as an error with code PGRST116
      if (error.code === 'PGRST116') { // PGRST116: "Row to singleton" - means 0 rows returned
        console.log(`Tournament with ID ${tournamentId} not found.`);
        return null;
      }
      throw error; // Re-throw other errors
    }
    
    if (!data) return null; // Should be redundant if PGRST116 is handled, but good for safety

    return {
      id: data.id,
      name: data.name,
      organizer: data.organizer_id,
      organizerId: data.organizer_id,
      date: data.start_date, // Assuming start_date is what's meant by 'date'
      startDate: data.start_date, // Adding for clarity if Tournament type uses startDate
      endDate: data.end_date,     // Adding for clarity if Tournament type uses endDate
      location: data.location,
      city: data.city,
      state: data.state,
      status: data.status as "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed",
      players: data.players || [], // Assuming 'players' is an array of player IDs
      totalRounds: data.rounds,
      currentRound: data.current_round || 1,
      category: data.category || 'Open',
      timeControl: data.time_control,
      description: data.description,
      pairings: data.pairings || [],
      standings: data.standings || [],
      processingDate: data.updated_at,
      // Ensure all fields from the Tournament type are mapped
      // Example: if Tournament type has 'hostId', 'registrationOpen', etc., map them here from 'data'
      hostId: data.host_id, // Example, adjust if field name differs
      registrationOpen: data.registration_open, // Example
    };
  } catch (error) {
    console.error(`Error getting tournament ${tournamentId} from Supabase:`, error);
    return null;
  }
};
