import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export interface CreateTournamentRequest {
  name: string;
  startDate: string;
  endDate: string;
  state: string;
  city: string;
  format: 'classical' | 'rapid' | 'blitz';
  roundsTotal: number;
  organizerId: string;
}

export interface CreateTournamentResponse {
  success: boolean;
  error?: string;
  tournament?: Tables<'tournaments'>;
}

/**
 * Create a new tournament (TO only)
 * Tournament starts in 'draft' status
 */
export async function createTournament(
  request: CreateTournamentRequest
): Promise<CreateTournamentResponse> {
  try {
    const tournamentData: TablesInsert<'tournaments'> = {
      name: request.name,
      start_date: request.startDate,
      end_date: request.endDate,
      state: request.state,
      city: request.city,
      format: request.format,
      rounds_total: request.roundsTotal,
      organizer_id: request.organizerId,
      status: 'draft',
      public_registration_open: false,
    };

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert(tournamentData)
      .select()
      .single();

    if (error) {
      console.error('Error creating tournament:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      tournament,
    };
  } catch (error) {
    console.error('Unexpected error in createTournament:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Update tournament status (draft -> active)
 */
export async function activateTournament(
  tournamentId: string,
  organizerId: string
): Promise<CreateTournamentResponse> {
  try {
    // Verify the tournament belongs to the organizer
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .eq('organizer_id', organizerId)
      .single();

    if (fetchError || !tournament) {
      return {
        success: false,
        error: 'Tournament not found or access denied',
      };
    }

    if (tournament.status !== 'draft') {
      return {
        success: false,
        error: 'Only draft tournaments can be activated',
      };
    }

    // Check if tournament has at least 2 players
    const { count: playerCount, error: countError } = await supabase
      .from('tournament_players')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', tournamentId)
      .eq('withdrawn', false);

    if (countError) {
      return {
        success: false,
        error: 'Error checking player count',
      };
    }

    if (!playerCount || playerCount < 2) {
      return {
        success: false,
        error: 'Tournament needs at least 2 players to be activated',
      };
    }

    // Update tournament status to active
    const { data: updatedTournament, error: updateError } = await supabase
      .from('tournaments')
      .update({ status: 'active' })
      .eq('id', tournamentId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      tournament: updatedTournament,
    };
  } catch (error) {
    console.error('Unexpected error in activateTournament:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get tournaments for a specific organizer
 */
export async function getOrganizerTournaments(organizerId: string) {
  try {
    const { data: tournaments, error } = await supabase
      .from('tournaments')
      .select(
        `
        *,
        tournament_players(count)
      `
      )
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
        tournaments: [],
      };
    }

    return {
      success: true,
      tournaments: tournaments || [],
    };
  } catch (error) {
    console.error('Unexpected error in getOrganizerTournaments:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      tournaments: [],
    };
  }
}
