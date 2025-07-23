import { supabase } from '@/integrations/supabase/client';

export interface GenerateNextRoundRequest {
  tournamentId: string;
  organizerId: string;
}

export interface GenerateNextRoundResponse {
  success: boolean;
  error?: string;
  roundId?: string;
  roundNumber?: number;
  pairingsCount?: number;
  hasBye?: boolean;
}

export interface CompleteTournamentRequest {
  tournamentId: string;
  organizerId: string;
}

export interface CompleteTournamentResponse {
  success: boolean;
  error?: string;
  tournamentId?: string;
  finalRound?: number;
  status?: string;
}

/**
 * Generate the next round of pairings for a tournament
 * Uses the RPC function defined in the database
 */
export async function generateNextRound({
  tournamentId,
  organizerId,
}: GenerateNextRoundRequest): Promise<GenerateNextRoundResponse> {
  try {
    // Verify tournament belongs to organizer
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .eq('organizer_id', organizerId)
      .single();

    if (tournamentError || !tournament) {
      return {
        success: false,
        error: 'Tournament not found or access denied',
      };
    }

    // Call the RPC function to generate next round
    const { data: result, error: rpcError } = await supabase.rpc(
      'rpc_generate_next_round',
      { tournament_id: tournamentId }
    );

    if (rpcError) {
      return {
        success: false,
        error: rpcError.message,
      };
    }

    // Parse the result from the RPC function
    if (result && typeof result === 'object' && 'success' in result) {
      if (result.success) {
        return {
          success: true,
          roundId: result.round_id,
          roundNumber: result.round_number,
          pairingsCount: result.pairings_count,
          hasBye: result.has_bye,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to generate next round',
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected response from round generation',
    };
  } catch (error) {
    console.error('Unexpected error in generateNextRound:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Complete a tournament (after all rounds are finished)
 */
export async function completeTournament({
  tournamentId,
  organizerId,
}: CompleteTournamentRequest): Promise<CompleteTournamentResponse> {
  try {
    // Verify tournament belongs to organizer
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .eq('organizer_id', organizerId)
      .single();

    if (tournamentError || !tournament) {
      return {
        success: false,
        error: 'Tournament not found or access denied',
      };
    }

    // Call the RPC function to complete tournament
    const { data: result, error: rpcError } = await supabase.rpc(
      'rpc_complete_tournament',
      { tournament_id: tournamentId }
    );

    if (rpcError) {
      return {
        success: false,
        error: rpcError.message,
      };
    }

    // Parse the result from the RPC function
    if (result && typeof result === 'object' && 'success' in result) {
      if (result.success) {
        return {
          success: true,
          tournamentId: result.tournament_id,
          finalRound: result.final_round,
          status: result.status,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to complete tournament',
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected response from tournament completion',
    };
  } catch (error) {
    console.error('Unexpected error in completeTournament:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get detailed tournament standings
 */
export async function getTournamentStandings(tournamentId: string) {
  try {
    const { data: standings, error } = await supabase.rpc(
      'get_tournament_standings_detailed',
      { tournament_id: tournamentId }
    );

    if (error) {
      return {
        success: false,
        error: error.message,
        standings: [],
      };
    }

    return {
      success: true,
      standings: standings || [],
    };
  } catch (error) {
    console.error('Unexpected error in getTournamentStandings:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      standings: [],
    };
  }
}
