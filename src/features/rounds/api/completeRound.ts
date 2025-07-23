import { supabase } from '@/integrations/supabase/client';

export interface CompleteRoundRequest {
  roundId: string;
  organizerId: string;
}

export interface CompleteRoundResponse {
  success: boolean;
  error?: string;
  roundId?: string;
  roundNumber?: number;
  tournamentId?: string;
  isFinalRound?: boolean;
}

/**
 * Mark a round as complete and recalculate standings
 * Uses the RPC function defined in the database
 */
export async function completeRound({
  roundId,
  organizerId,
}: CompleteRoundRequest): Promise<CompleteRoundResponse> {
  try {
    // First, verify that the organizer owns the tournament
    const { data: round, error: roundError } = await supabase
      .from('rounds')
      .select(
        `
        *,
        tournaments!inner (
          organizer_id,
          status,
          rounds_total
        )
      `
      )
      .eq('id', roundId)
      .single();

    if (roundError || !round) {
      return {
        success: false,
        error: 'Round not found',
      };
    }

    // Check if organizer owns the tournament
    if (round.tournaments.organizer_id !== organizerId) {
      return {
        success: false,
        error:
          'Access denied: You can only complete rounds for your own tournaments',
      };
    }

    // Check if tournament is in a valid state
    if (!['ongoing', 'active'].includes(round.tournaments.status)) {
      return {
        success: false,
        error: 'Rounds can only be completed for active or ongoing tournaments',
      };
    }

    // Check if round is already completed
    if (round.status === 'completed') {
      return {
        success: false,
        error: 'Round is already completed',
      };
    }

    // Call the RPC function to complete the round
    const { data: result, error: rpcError } = await supabase.rpc(
      'rpc_mark_round_complete',
      { round_id: roundId }
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
          tournamentId: result.tournament_id,
          isFinalRound: result.is_final_round,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to complete round',
        };
      }
    }

    // If RPC function doesn't return expected format, handle manually
    return {
      success: true,
      roundId: roundId,
      roundNumber: round.number,
      tournamentId: round.tournament_id,
      isFinalRound: round.number === round.tournaments.rounds_total,
    };
  } catch (error) {
    console.error('Unexpected error in completeRound:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}
