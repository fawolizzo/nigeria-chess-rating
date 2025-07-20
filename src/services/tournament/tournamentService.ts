import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { Tournament } from '@/types/tournamentTypes';

/**
 * Create a new tournament in Supabase
 */
export const createTournament = async (
  tournamentData: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>
): Promise<Tournament> => {
  try {
    console.log('🏆 Creating tournament in Supabase:', tournamentData);
    console.log(
      '🔍 Tournament data structure:',
      JSON.stringify(tournamentData, null, 2)
    );

    // Prepare tournament data for Supabase (exclude non-existent columns)
    const supabaseTournament = {
      name: tournamentData.name,
      description: tournamentData.description,
      start_date: tournamentData.start_date,
      end_date: tournamentData.end_date,
      location: tournamentData.location,
      city: tournamentData.city,
      state: tournamentData.state,
      organizer_id: tournamentData.organizer_id,
      status: tournamentData.status,
      rounds: tournamentData.rounds,
      current_round: tournamentData.current_round,
      time_control: tournamentData.time_control,
      participants: tournamentData.participants,
      registration_open: tournamentData.registration_open,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Excluded: players, pairings, results - these don't exist in the table
    };

    console.log(
      '📤 Sending to Supabase (filtered):',
      JSON.stringify(supabaseTournament, null, 2)
    );

    // Use admin client to create tournament
    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .insert([supabaseTournament])
      .select()
      .single();

    if (error) {
      console.error('❌ Supabase error details:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.details);
      console.error('❌ Error hint:', error.hint);
      throw new Error(
        `Failed to create tournament: ${error.message} (Code: ${error.code})`
      );
    }

    console.log('✅ Tournament created successfully:', data);
    return data as Tournament;
  } catch (error) {
    console.error('❌ Tournament creation failed:', error);
    if (error instanceof Error) {
      console.error('❌ Error name:', error.name);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
    }
    throw error;
  }
};

/**
 * Get all tournaments from Supabase
 */
export const getAllTournaments = async (): Promise<Tournament[]> => {
  try {
    console.log('🔍 Fetching all tournaments from Supabase...');

    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tournaments:', error);
      throw new Error(`Failed to fetch tournaments: ${error.message}`);
    }

    console.log(`✅ Fetched ${data?.length || 0} tournaments from Supabase`);
    return (data as Tournament[]) || [];
  } catch (error) {
    console.error('❌ Failed to fetch tournaments:', error);
    return [];
  }
};

/**
 * Get tournaments by organizer ID
 */
export const getTournamentsByOrganizer = async (
  organizerId: string
): Promise<Tournament[]> => {
  try {
    console.log('🔍 Fetching tournaments for organizer:', organizerId);

    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching organizer tournaments:', error);
      throw new Error(
        `Failed to fetch organizer tournaments: ${error.message}`
      );
    }

    console.log(
      `✅ Fetched ${data?.length || 0} tournaments for organizer ${organizerId}`
    );
    return (data as Tournament[]) || [];
  } catch (error) {
    console.error('❌ Failed to fetch organizer tournaments:', error);
    return [];
  }
};

/**
 * Get tournament by ID
 */
export const getTournamentById = async (
  id: string
): Promise<Tournament | null> => {
  try {
    console.log('🔍 Fetching tournament by ID:', id);

    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ Tournament not found:', id);
        return null;
      }
      console.error('❌ Error fetching tournament:', error);
      throw new Error(`Failed to fetch tournament: ${error.message}`);
    }

    console.log('✅ Tournament fetched successfully:', data.name);
    return data as Tournament;
  } catch (error) {
    console.error('❌ Failed to fetch tournament:', error);
    return null;
  }
};

/**
 * Update tournament in Supabase
 */
export const updateTournament = async (
  id: string,
  updates: Partial<Tournament>
): Promise<Tournament | null> => {
  try {
    console.log('🔄 Updating tournament:', id, updates);

    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Error updating tournament:', error);
      throw new Error(`Failed to update tournament: ${error.message}`);
    }

    console.log('✅ Tournament updated successfully:', data.name);
    return data as Tournament;
  } catch (error) {
    console.error('❌ Failed to update tournament:', error);
    return null;
  }
};

/**
 * Delete tournament from Supabase
 */
export const deleteTournament = async (id: string): Promise<boolean> => {
  try {
    console.log('🗑️ Deleting tournament:', id);

    const { error } = await supabaseAdmin
      .from('tournaments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('❌ Error deleting tournament:', error);
      throw new Error(`Failed to delete tournament: ${error.message}`);
    }

    console.log('✅ Tournament deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete tournament:', error);
    return false;
  }
};

/**
 * Get tournaments by status
 */
export const getTournamentsByStatus = async (
  status: string
): Promise<Tournament[]> => {
  try {
    console.log('🔍 Fetching tournaments by status:', status);

    const { data, error } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching tournaments by status:', error);
      throw new Error(
        `Failed to fetch tournaments by status: ${error.message}`
      );
    }

    console.log(
      `✅ Fetched ${data?.length || 0} tournaments with status ${status}`
    );
    return (data as Tournament[]) || [];
  } catch (error) {
    console.error('❌ Failed to fetch tournaments by status:', error);
    return [];
  }
};

// Legacy exports for backward compatibility
export const createTournamentInSupabase = createTournament;
export const getTournamentsFromSupabase = getAllTournaments;
export const updateTournamentInSupabase = updateTournament;
