import { supabase } from '@/integrations/supabase/client';

export type GameResult = 'white_win' | 'black_win' | 'draw' | 'bye' | 'white_forfeit' | 'black_forfeit' | 'double_forfeit';

export interface UpdateResultRequest {
  pairingId: string;
  result: GameResult;
  organizerId: string;
}

export interface UpdateResultResponse {
  success: boolean;
  error?: string;
  pairing?: any;
}

/**
 * Update the result of a specific pairing
 * Only tournament organizers can update results
 */
export async function updatePairingResult({
  pairingId,
  result,
  organizerId,
}: UpdateResultRequest): Promise<UpdateResultResponse> {
  try {
    // First, verify that the organizer owns the tournament
    const { data: pairing, error: pairingError } = await supabase
      .from('pairings')
      .select(
        `
        *,
        rounds!inner (
          tournament_id,
          tournaments!inner (
            organizer_id,
            status
          )
        )
      `
      )
      .eq('id', pairingId)
      .single();

    if (pairingError || !pairing) {
      return {
        success: false,
        error: 'Pairing not found',
      };
    }

    // Check if organizer owns the tournament
    if (pairing.rounds.tournaments.organizer_id !== organizerId) {
      return {
        success: false,
        error:
          'Access denied: You can only update results for your own tournaments',
      };
    }

    // Check if tournament is in a valid state for result entry
    if (!['ongoing', 'active'].includes(pairing.rounds.tournaments.status)) {
      return {
        success: false,
        error: 'Results can only be entered for active or ongoing tournaments',
      };
    }

    // Update the pairing result
    const { data: updatedPairing, error: updateError } = await supabase
      .from('pairings')
      .update({
        result,
        result_entered_by: organizerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pairingId)
      .select(
        `
        *,
        white_player:players!pairings_white_player_id_fkey (
          id,
          full_name
        ),
        black_player:players!pairings_black_player_id_fkey (
          id,
          full_name
        )
      `
      )
      .single();

    if (updateError) {
      return {
        success: false,
        error: updateError.message,
      };
    }

    return {
      success: true,
      pairing: updatedPairing,
    };
  } catch (error) {
    console.error('Unexpected error in updatePairingResult:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get all pairings for a specific round with current results
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
        ),
        result_entered_by_user:users!pairings_result_entered_by_fkey (
          id,
          email
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

/**
 * Check if all pairings in a round have results
 */
export async function checkRoundComplete(roundId: string) {
  try {
    const { count: totalPairings, error: totalError } = await supabase
      .from('pairings')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', roundId);

    if (totalError) {
      return {
        success: false,
        error: totalError.message,
        isComplete: false,
        totalPairings: 0,
        completedPairings: 0,
      };
    }

    const { count: completedPairings, error: completedError } = await supabase
      .from('pairings')
      .select('*', { count: 'exact', head: true })
      .eq('round_id', roundId)
      .not('result', 'is', null);

    if (completedError) {
      return {
        success: false,
        error: completedError.message,
        isComplete: false,
        totalPairings: totalPairings || 0,
        completedPairings: 0,
      };
    }

    return {
      success: true,
      isComplete:
        (completedPairings || 0) === (totalPairings || 0) &&
        (totalPairings || 0) > 0,
      totalPairings: totalPairings || 0,
      completedPairings: completedPairings || 0,
    };
  } catch (error) {
    console.error('Unexpected error in checkRoundComplete:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      isComplete: false,
      totalPairings: 0,
      completedPairings: 0,
    };
  }
}
