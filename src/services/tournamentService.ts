
import { supabase } from "@/integrations/supabase/client";
import { Tournament } from "@/lib/mockData";

// Map database tournaments to application Tournament type
const mapDatabaseTournament = (dbTournament: any): Tournament => {
  return {
    id: dbTournament.id,
    name: dbTournament.name,
    description: dbTournament.description || '',
    startDate: dbTournament.start_date,
    endDate: dbTournament.end_date,
    location: dbTournament.location,
    city: dbTournament.city,
    state: dbTournament.state,
    organizerId: dbTournament.organizer_id,
    status: dbTournament.status,
    rounds: dbTournament.rounds,
    currentRound: dbTournament.current_round || 1,
    category: 'classical' as const,
    timeControl: dbTournament.time_control,
    participants: dbTournament.participants || 0,
    registrationOpen: dbTournament.registration_open || false,
    players: [],
    pairings: [],
    standings: [],
    createdAt: dbTournament.created_at,
    updatedAt: dbTournament.updated_at
  };
};

export const getTournamentsFromSupabase = async (): Promise<Tournament[]> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(mapDatabaseTournament);
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
};

export const getTournamentByIdFromSupabase = async (tournamentId: string): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return mapDatabaseTournament(data);
  } catch (error) {
    console.error(`Error fetching tournament ${tournamentId}:`, error);
    return null;
  }
};

export const createTournamentInSupabase = async (tournamentData: any): Promise<Tournament | null> => {
  try {
    const dbTournamentData = {
      name: tournamentData.name,
      description: tournamentData.description || '',
      start_date: tournamentData.startDate,
      end_date: tournamentData.endDate,
      location: tournamentData.location,
      city: tournamentData.city || '',
      state: tournamentData.state || '',
      time_control: tournamentData.timeControl,
      rounds: tournamentData.rounds,
      organizer_id: tournamentData.organizerId,
      status: tournamentData.status || 'pending',
      current_round: 1,
      participants: 0,
      registration_open: tournamentData.registrationOpen || true
    };

    const { data, error } = await supabase
      .from('tournaments')
      .insert([dbTournamentData])
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseTournament(data);
  } catch (error) {
    console.error("Error creating tournament:", error);
    return null;
  }
};

export const updateTournamentInSupabase = async (tournamentId: string, updates: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    const dbUpdates: Record<string, any> = {};
    
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate;
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.rounds !== undefined) dbUpdates.rounds = updates.rounds;
    if (updates.currentRound !== undefined) dbUpdates.current_round = updates.currentRound;
    if (updates.participants !== undefined) dbUpdates.participants = updates.participants;
    if (updates.registrationOpen !== undefined) dbUpdates.registration_open = updates.registrationOpen;
    if (updates.timeControl !== undefined) dbUpdates.time_control = updates.timeControl;

    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('tournaments')
      .update(dbUpdates)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    return mapDatabaseTournament(data);
  } catch (error) {
    console.error(`Error updating tournament ${tournamentId}:`, error);
    return null;
  }
};
