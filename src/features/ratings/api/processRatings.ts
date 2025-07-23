import { supabase } from '@/integrations/supabase/client';

export interface ProcessRatingsRequest {
  tournamentId: string;
  organizerId: string;
}

export interface ProcessRatingsResponse {
  success: boolean;
  error?: string;
  jobId?: string;
  playersProcessed?: number;
  summary?: RatingChange[];
}

export interface RatingChange {
  player_id: string;
  old_rating: number;
  new_rating: number;
  delta: number;
}

export interface RatingJobStatus {
  id: string;
  tournament_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  summary_json: RatingChange[] | null;
}

/**
 * Process ratings for a completed tournament
 * Only tournament organizers or rating officers can process ratings
 */
export async function processRatings({
  tournamentId,
  organizerId,
}: ProcessRatingsRequest): Promise<ProcessRatingsResponse> {
  try {
    // Verify tournament belongs to organizer and is completed
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

    if (tournament.status !== 'completed') {
      return {
        success: false,
        error: 'Tournament must be completed before processing ratings',
      };
    }

    // Check if ratings are already processed
    const { data: existingJob, error: jobError } = await supabase
      .from('rating_jobs')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    if (!jobError && existingJob && existingJob.status === 'completed') {
      return {
        success: false,
        error: 'Ratings have already been processed for this tournament',
      };
    }

    // Call the RPC function to process ratings
    const { data: result, error: rpcError } = await supabase.rpc(
      'rpc_process_tournament_ratings',
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
          playersProcessed: result.players_processed,
          summary: result.summary,
        };
      } else {
        return {
          success: false,
          error: result.error || 'Failed to process ratings',
        };
      }
    }

    return {
      success: false,
      error: 'Unexpected response from rating processing',
    };
  } catch (error) {
    console.error('Unexpected error in processRatings:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get rating job status for a tournament
 */
export async function getRatingJobStatus(tournamentId: string): Promise<{
  success: boolean;
  error?: string;
  job?: RatingJobStatus;
}> {
  try {
    const { data: job, error } = await supabase
      .from('rating_jobs')
      .select('*')
      .eq('tournament_id', tournamentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      job: job || undefined,
    };
  } catch (error) {
    console.error('Unexpected error in getRatingJobStatus:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Get rating changes for players in a tournament
 */
export async function getTournamentRatingChanges(
  tournamentId: string
): Promise<{
  success: boolean;
  error?: string;
  changes: RatingChange[];
}> {
  try {
    const { data: job, error } = await supabase
      .from('rating_jobs')
      .select('summary_json')
      .eq('tournament_id', tournamentId)
      .eq('status', 'completed')
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
        changes: [],
      };
    }

    return {
      success: true,
      changes: (job.summary_json as RatingChange[]) || [],
    };
  } catch (error) {
    console.error('Unexpected error in getTournamentRatingChanges:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      changes: [],
    };
  }
}
