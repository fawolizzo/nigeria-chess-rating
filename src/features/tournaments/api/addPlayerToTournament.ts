import { supabase } from '@/integrations/supabase/client';
import { Tables, TablesInsert } from '@/integrations/supabase/types';

export interface AddExistingPlayerRequest {
  tournamentId: string;
  playerId: string;
  organizerId: string;
}

export interface CreateNewPlayerRequest {
  tournamentId: string;
  organizerId: string;
  playerData: {
    fullName: string;
    state?: string;
    gender?: string;
  };
}

export interface AddPlayerResponse {
  success: boolean;
  error?: string;
  player?: Tables<'players'>;
  tournamentPlayer?: Tables<'tournament_players'>;
}

/**
 * Add an existing player to a tournament
 */
export async function addExistingPlayerToTournament({
  tournamentId,
  playerId,
  organizerId,
}: AddExistingPlayerRequest): Promise<AddPlayerResponse> {
  try {
    // Verify tournament belongs to organizer and is in draft status
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

    if (tournament.status !== 'draft') {
      return {
        success: false,
        error: 'Players can only be added to draft tournaments',
      };
    }

    // Check if player exists and is active
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return {
        success: false,
        error: 'Player not found',
      };
    }

    // Check if player is already in tournament
    const { data: existingEntry, error: checkError } = await supabase
      .from('tournament_players')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return {
        success: false,
        error: 'Error checking existing registration',
      };
    }

    if (existingEntry) {
      return {
        success: false,
        error: 'Player is already registered for this tournament',
      };
    }

    // Get the appropriate rating based on tournament format
    let seedRating: number;
    switch (tournament.format) {
      case 'rapid':
        seedRating = player.rapid_rating;
        break;
      case 'blitz':
        seedRating = player.blitz_rating;
        break;
      default:
        seedRating = player.classical_rating;
    }

    // Add player to tournament
    const { data: tournamentPlayer, error: addError } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        player_id: playerId,
        seed_rating: seedRating,
      })
      .select()
      .single();

    if (addError) {
      return {
        success: false,
        error: addError.message,
      };
    }

    return {
      success: true,
      player,
      tournamentPlayer,
    };
  } catch (error) {
    console.error('Unexpected error in addExistingPlayerToTournament:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Create a new player and add them to a tournament
 */
export async function createAndAddPlayerToTournament({
  tournamentId,
  organizerId,
  playerData,
}: CreateNewPlayerRequest): Promise<AddPlayerResponse> {
  try {
    // Verify tournament belongs to organizer and is in draft status
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

    if (tournament.status !== 'draft') {
      return {
        success: false,
        error: 'Players can only be added to draft tournaments',
      };
    }

    // Create new player
    const newPlayerData: TablesInsert<'players'> = {
      full_name: playerData.fullName,
      state: playerData.state || null,
      gender: playerData.gender || null,
      status: 'pending',
      created_by: organizerId,
    };

    const { data: player, error: playerError } = await supabase
      .from('players')
      .insert(newPlayerData)
      .select()
      .single();

    if (playerError) {
      return {
        success: false,
        error: `Failed to create player: ${playerError.message}`,
      };
    }

    // Get the appropriate default rating based on tournament format
    let seedRating: number;
    switch (tournament.format) {
      case 'rapid':
        seedRating = player.rapid_rating;
        break;
      case 'blitz':
        seedRating = player.blitz_rating;
        break;
      default:
        seedRating = player.classical_rating;
    }

    // Add player to tournament
    const { data: tournamentPlayer, error: addError } = await supabase
      .from('tournament_players')
      .insert({
        tournament_id: tournamentId,
        player_id: player.id,
        seed_rating: seedRating,
      })
      .select()
      .single();

    if (addError) {
      return {
        success: false,
        error: addError.message,
      };
    }

    return {
      success: true,
      player,
      tournamentPlayer,
    };
  } catch (error) {
    console.error('Unexpected error in createAndAddPlayerToTournament:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

/**
 * Search for players by name
 */
export async function searchPlayers(query: string, limit: number = 10) {
  try {
    if (query.length < 2) {
      return {
        success: true,
        players: [],
      };
    }

    const { data: players, error } = await supabase
      .from('players')
      .select(
        'id, full_name, state, classical_rating, rapid_rating, blitz_rating, status'
      )
      .ilike('full_name', `%${query}%`)
      .eq('status', 'active')
      .order('full_name')
      .limit(limit);

    if (error) {
      return {
        success: false,
        error: error.message,
        players: [],
      };
    }

    return {
      success: true,
      players: players || [],
    };
  } catch (error) {
    console.error('Unexpected error in searchPlayers:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      players: [],
    };
  }
}

/**
 * Get players registered for a tournament
 */
export async function getTournamentPlayers(tournamentId: string) {
  try {
    const { data: tournamentPlayers, error } = await supabase
      .from('tournament_players')
      .select(
        `
        *,
        players (
          id,
          full_name,
          state,
          gender,
          classical_rating,
          rapid_rating,
          blitz_rating,
          status
        )
      `
      )
      .eq('tournament_id', tournamentId)
      .eq('withdrawn', false)
      .order('seed_rating', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message,
        players: [],
      };
    }

    return {
      success: true,
      players: tournamentPlayers || [],
    };
  } catch (error) {
    console.error('Unexpected error in getTournamentPlayers:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      players: [],
    };
  }
}
