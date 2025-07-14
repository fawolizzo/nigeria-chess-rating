import { Tournament, Player, Pairing, Result } from "@/lib/mockData";
import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/integrations/supabase/client";
import { generateSwissPairings } from "@/lib/swissPairingService";

export const createTournament = async (tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>): Promise<Tournament> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: tournamentData.name,
        description: tournamentData.description,
        location: tournamentData.location,
        city: tournamentData.city,
        state: tournamentData.state,
        rounds: tournamentData.rounds,
        start_date: tournamentData.start_date,
        end_date: tournamentData.end_date,
        time_control: tournamentData.time_control,
        organizer_id: tournamentData.organizer_id,
        registration_open: tournamentData.registration_open,
        status: tournamentData.status,
        participants: tournamentData.participants || 0,
        current_round: tournamentData.current_round || 1
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating tournament:", error);
      throw new Error("Failed to create tournament");
    }

    // Transform to Tournament type with additional fields
    const newTournament: Tournament = {
      ...data,
      status: data.status as "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed",
      players: [],
      pairings: [],
      results: []
    };

    return newTournament;
  } catch (error) {
    console.error("Error creating tournament:", error);
    throw new Error("Failed to create tournament");
  }
};

export const getAllTournaments = async (): Promise<Tournament[]> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching tournaments:", error);
      return [];
    }

    // Transform to Tournament type with additional fields
    return data.map(tournament => ({
      ...tournament,
      status: tournament.status as "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed",
      players: [],
      pairings: [],
      results: []
    }));
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
};

export const getTournamentById = async (id: string): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error getting tournament:", error);
      return null;
    }

    // Transform to Tournament type with additional fields
    return {
      ...data,
      status: data.status as "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed",
      players: [],
      pairings: [],
      results: []
    };
  } catch (error) {
    console.error("Error getting tournament:", error);
    return null;
  }
};

export const updateTournament = async (id: string, updates: Partial<Tournament>): Promise<Tournament | null> => {
  try {
    const { data, error } = await supabase
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating tournament:", error);
      return null;
    }

    // Transform to Tournament type with additional fields
    return {
      ...data,
      status: data.status as "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed",
      players: [],
      pairings: [],
      results: []
    };
  } catch (error) {
    console.error("Error updating tournament:", error);
    return null;
  }
};

// Legacy exports for backward compatibility
export const createTournamentInSupabase = createTournament;
export const getTournamentsFromSupabase = getAllTournaments;
export const updateTournamentInSupabase = updateTournament;

export const addPlayerToTournament = async (tournamentId: string, players: Player[]): Promise<boolean> => {
  try {
    // Add players to tournament_players junction table
    const tournamentPlayers = players.map(player => ({
      tournament_id: tournamentId,
      player_id: player.id
    }));

    const { error } = await supabase
      .from('tournament_players')
      .insert(tournamentPlayers);

    if (error) {
      console.error("Error adding players to tournament:", error);
      return false;
    }

    // Update tournament participant count
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({
        participants: players.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId);

    if (updateError) {
      console.error("Error updating tournament participants:", updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error adding players to tournament:", error);
    return false;
  }
};

export const generatePairings = async (tournamentId: string): Promise<boolean> => {
  try {
    // Get tournament with players
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return false;
    }

    // Get players for tournament from junction table
    const { data: tournamentPlayers, error: playersError } = await supabase
      .from('tournament_players')
      .select(`
        player_id,
        players (*)
      `)
      .eq('tournament_id', tournamentId);

    if (playersError || !tournamentPlayers) {
      console.error("Error getting tournament players:", playersError);
      return false;
    }

    const players = tournamentPlayers.map(tp => tp.players).filter(Boolean);
    
    if (players.length === 0) {
      return false;
    }

    // Transform supabase players to Player interface
    const transformedPlayers: Player[] = players.map(player => ({
      ...player,
      title: player.title as "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM" | undefined,
      status: player.status as "pending" | "approved" | "rejected"
    }));

    const pairings = generateSwissPairings(transformedPlayers, tournament.current_round || 1);
    
    // Note: In a full implementation, you'd store pairings in a separate table
    // For now, we'll just indicate success
    return true;
  } catch (error) {
    console.error("Error generating pairings:", error);
    return false;
  }
};

export const recordResult = async (tournamentId: string, pairingId: string, result: "1-0" | "0-1" | "1/2-1/2"): Promise<boolean> => {
  try {
    // Note: In a full implementation, you'd store results in a separate table
    // For now, we'll just indicate success
    console.log(`Recording result for tournament ${tournamentId}, pairing ${pairingId}: ${result}`);
    return true;
  } catch (error) {
    console.error("Error recording result:", error);
    return false;
  }
};

export const nextRound = async (tournamentId: string): Promise<boolean> => {
  try {
    // Get current tournament to increment round
    const tournament = await getTournamentById(tournamentId);
    if (!tournament) {
      return false;
    }

    const { error } = await supabase
      .from('tournaments')
      .update({
        current_round: (tournament.current_round || 1) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId);

    if (error) {
      console.error("Error advancing to next round:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error advancing to next round:", error);
    return false;
  }
};
