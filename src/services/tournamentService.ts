
import { supabase } from "@/integrations/supabase/client";
import { Tournament } from "@/lib/mockData";

export const getTournamentsFromSupabase = async (): Promise<Tournament[]> => {
  try {
    const { data, error } = await supabase.from('tournaments').select('*');
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
