import { supabase } from '@/integrations/supabase/client';

export interface GenerateRound1Request {
  tournamentId: string;
  organizerId: string;
}

export interface GenerateRound1Response {
  success: boolean;
  error?: string;
  roundId?: string;
  pairingsCount?: number;
  hasBye?: boolean;
}

/**
 * Generate Round 1 Swiss pairings for a tournament
 * Uses the RPC function defined in the database
 */
export async function generateRound1({
  tournamentId,
  organizerId,
}: GenerateRound1Request): Promise<GenerateRound1Response> {
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

    // Call the RPC function to generate Round 1
    const { data: result, error: rpcError } = await supabase.rpc(
      'rpc_generate_round1' as any,
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
      const typedResult = result as any;
      if (typedResult.success) {
        return {
          success: true,
          roundId: typedResult.round_id,
          pairingsCount: typedResult.pairings_count,
          hasBye: typedResult.has_bye,
        };
      } else {
        return {
          success: false,
          error: typedResult.error || 'Failed to generate pairings',
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected response from pairing generation',
    };
  } catch (error) {
    console.error('Unexpected error in generateRound1:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get tournament rounds with pairings
 */
export async function getTournamentRounds(tournamentId: string) {
  try {
    const { data: rounds, error } = await supabase
      .from('rounds')
      .select(
        `
        *,
        pairings (
          *,
          white_player:players!pairings_white_player_id_fkey (
            id,
            full_name,
            state
          ),
          black_player:players!pairings_black_player_id_fkey (
            id,
            full_name,
            state
          )
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .order('number');

    if (error) {
      return {
        success: false,
        error: error.message,
        rounds: [],
      };
    }

    return {
      success: true,
      rounds: rounds || [],
    };
  } catch (error) {
    console.error('Unexpected error in getTournamentRounds:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      rounds: [],
    };
  }
}

/**
 * Get specific round pairings
 */
export async function getRoundPairings(roundId: string) {
  try {
    const { data: pairings, error } = await supabase
      .from('pairings')
      .select(
        `
        *,
        white_player:players!pairings_white_player_id_fkey (
          id,
          full_name,
          state
        ),
        black_player:players!pairings_black_player_id_fkey (
          id,
          full_name,
          state
        )
      `
      )
      .eq('round_id', roundId)
      .order('board_number');

    if (error) {
      return {
        success: false,
        error: error.message,
        pairings: [],
      };
    }

    return {
      success: true,
      pairings: pairings || [],
    };
  } catch (error) {
    console.error('Unexpected error in getRoundPairings:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      pairings: [],
    };
  }
}
