
import { Tournament, Player, Pairing } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export const saveTournament = (tournament: Tournament): void => {
  try {
    const tournaments = getAllTournaments();
    const existingIndex = tournaments.findIndex(t => t.id === tournament.id);
    
    if (existingIndex >= 0) {
      tournaments[existingIndex] = tournament;
    } else {
      tournaments.push(tournament);
    }
    
    localStorage.setItem('ncr_tournaments', JSON.stringify(tournaments));
  } catch (error) {
    console.error("Error saving tournament:", error);
  }
};

export const getAllTournaments = (): Tournament[] => {
  try {
    const data = localStorage.getItem('ncr_tournaments');
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error getting tournaments:", error);
    return [];
  }
};

export const getTournamentById = (id: string): Tournament | null => {
  try {
    const tournaments = getAllTournaments();
    return tournaments.find(t => t.id === id) || null;
  } catch (error) {
    console.error("Error getting tournament by ID:", error);
    return null;
  }
};

export const deleteTournament = (id: string): boolean => {
  try {
    const tournaments = getAllTournaments();
    const filteredTournaments = tournaments.filter(t => t.id !== id);
    localStorage.setItem('ncr_tournaments', JSON.stringify(filteredTournaments));
    return true;
  } catch (error) {
    console.error("Error deleting tournament:", error);
    return false;
  }
};

export const getTournamentsFromSupabase = async (): Promise<Tournament[]> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*');
    
    if (error) throw error;
    
    return data?.map(tournament => ({
      id: tournament.id,
      name: tournament.name,
      description: tournament.description || '',
      startDate: tournament.start_date,
      endDate: tournament.end_date,
      location: tournament.location,
      city: tournament.city,
      state: tournament.state,
      organizerId: tournament.organizer_id,
      players: [],
      pairings: [],
      rounds: tournament.rounds,
      currentRound: tournament.current_round || 1,
      status: tournament.status as Tournament['status'],
      timeControl: tournament.time_control,
      participants: tournament.participants || 0,
      registrationOpen: tournament.registration_open || true,
    })) || [];
  } catch (error) {
    console.error("Error fetching tournaments from Supabase:", error);
    return [];
  }
};

export const getTournamentByIdFromSupabase = async (id: string): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      city: data.city,
      state: data.state,
      organizerId: data.organizer_id,
      players: [],
      pairings: [],
      rounds: data.rounds,
      currentRound: data.current_round || 1,
      status: data.status as Tournament['status'],
      timeControl: data.time_control,
      participants: data.participants || 0,
      registrationOpen: data.registration_open || true,
    };
  } catch (error) {
    console.error("Error fetching tournament by ID from Supabase:", error);
    return null;
  }
};

export const createTournamentInSupabase = async (tournamentData: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert([{
        name: tournamentData.name,
        description: tournamentData.description,
        start_date: tournamentData.startDate,
        end_date: tournamentData.endDate,
        location: tournamentData.location,
        city: tournamentData.city,
        state: tournamentData.state,
        organizer_id: tournamentData.organizerId,
        rounds: tournamentData.rounds,
        status: tournamentData.status || 'pending',
        time_control: tournamentData.timeControl,
        participants: tournamentData.participants || 0,
        registration_open: tournamentData.registrationOpen !== false,
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      city: data.city,
      state: data.state,
      organizerId: data.organizer_id,
      players: [],
      pairings: [],
      rounds: data.rounds,
      currentRound: data.current_round || 1,
      status: data.status as Tournament['status'],
      timeControl: data.time_control,
      participants: data.participants || 0,
      registrationOpen: data.registration_open || true,
    };
  } catch (error) {
    console.error("Error creating tournament in Supabase:", error);
    return null;
  }
};

export const updateTournamentInSupabase = async (id: string, tournamentData: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    const updateData: any = {};
    
    if (tournamentData.name !== undefined) updateData.name = tournamentData.name;
    if (tournamentData.description !== undefined) updateData.description = tournamentData.description;
    if (tournamentData.startDate !== undefined) updateData.start_date = tournamentData.startDate;
    if (tournamentData.endDate !== undefined) updateData.end_date = tournamentData.endDate;
    if (tournamentData.location !== undefined) updateData.location = tournamentData.location;
    if (tournamentData.city !== undefined) updateData.city = tournamentData.city;
    if (tournamentData.state !== undefined) updateData.state = tournamentData.state;
    if (tournamentData.status !== undefined) updateData.status = tournamentData.status;
    if (tournamentData.rounds !== undefined) updateData.rounds = tournamentData.rounds;
    if (tournamentData.currentRound !== undefined) updateData.current_round = tournamentData.currentRound;
    if (tournamentData.timeControl !== undefined) updateData.time_control = tournamentData.timeControl;
    if (tournamentData.participants !== undefined) updateData.participants = tournamentData.participants;
    if (tournamentData.registrationOpen !== undefined) updateData.registration_open = tournamentData.registrationOpen;
    
    const { data, error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      city: data.city,
      state: data.state,
      organizerId: data.organizer_id,
      players: [],
      pairings: [],
      rounds: data.rounds,
      currentRound: data.current_round || 1,
      status: data.status as Tournament['status'],
      timeControl: data.time_control,
      participants: data.participants || 0,
      registrationOpen: data.registration_open || true,
    };
  } catch (error) {
    console.error("Error updating tournament in Supabase:", error);
    return null;
  }
};
