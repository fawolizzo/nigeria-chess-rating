import { Player } from '@/lib/mockData';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';

const transformSupabasePlayer = (data: any): Player => ({
  id: data.id,
  name: data.name,
  email: data.email,
  phone: data.phone,
  fideId: data.fide_id,
  title: data.title,
  titleVerified: data.title_verified,
  rating: data.rating,
  rapidRating: data.rapid_rating,
  blitzRating: data.blitz_rating,
  state: data.state,
  country: data.country || 'Nigeria',
  gender: data.gender,
  status: data.status,
  created_at: data.created_at,
  gamesPlayed: data.games_played,
  rapidGamesPlayed: data.rapid_games_played,
  blitzGamesPlayed: data.blitz_games_played,
  birthYear: data.birth_year,
  club: data.club,
  ratingHistory: [],
  rapidRatingHistory: [],
  blitzRatingHistory: [],
  achievements: [],
  tournamentResults: [],
});

export const getAllPlayersFromSupabase = async ({
  status,
}: { status?: string } = {}): Promise<Player[]> => {
  try {
    console.log(
      '🔍 [PlayerService] Fetching players with status filter:',
      status || 'all'
    );
    console.log('🔍 [PlayerService] Using admin client to bypass RLS');

    // Use admin client to bypass RLS for reading players
    let query = supabaseAdmin.from('players').select('*');
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    console.log('🔍 [PlayerService] Executing Supabase query...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ [PlayerService] Supabase admin query error:', error);
      console.error('❌ [PlayerService] Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log('✅ [PlayerService] Query executed successfully');
    console.log('📊 [PlayerService] Raw data type:', typeof data);
    console.log(
      '📊 [PlayerService] Raw data length:',
      data?.length || 'null/undefined'
    );

    if (!data) {
      console.warn('⚠️ [PlayerService] Supabase returned null/undefined data');
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn(
        '⚠️ [PlayerService] Supabase returned non-array data:',
        data
      );
      throw new Error('Invalid data format from Supabase');
    }

    console.log(
      '✅ [PlayerService] Successfully fetched',
      data.length,
      'players from Supabase'
    );

    if (data.length > 0) {
      console.log(
        '📋 [PlayerService] Sample raw players:',
        data.slice(0, 3).map((p) => ({
          name: p.name,
          status: p.status,
          rating: p.rating,
          id: p.id?.slice(0, 8),
        }))
      );
    }

    const transformedData = data.map(transformSupabasePlayer);
    const sortedData = transformedData.sort(
      (a, b) => (b.rating || 800) - (a.rating || 800)
    );

    if (sortedData.length > 0) {
      console.log(
        '🏆 [PlayerService] Top 3 players by rating:',
        sortedData.slice(0, 3).map((p) => ({
          name: p.name,
          rating: p.rating,
        }))
      );
    }

    return sortedData;
  } catch (dbError) {
    console.error('❌ [PlayerService] Database operation failed:', dbError);
    console.error(
      '❌ [PlayerService] Error stack:',
      dbError instanceof Error ? dbError.stack : 'No stack trace'
    );
    throw new Error(
      `Failed to fetch players: ${dbError instanceof Error ? dbError.message : 'Database connection failed'}`
    );
  }
};

export const getAllUsers = async (): Promise<Player[]> => {
  const { data, error } = await supabaseAdmin.from('players').select('*');
  if (error || !Array.isArray(data)) {
    console.error('❌ Error fetching all users:', error);
    return [];
  }
  return data.map(transformSupabasePlayer);
};

export const getPlayerByIdFromSupabase = async (
  id: string
): Promise<Player | null> => {
  const { data, error } = await supabaseAdmin
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    console.error('❌ Error fetching player by ID:', error);
    return null;
  }
  return transformSupabasePlayer(data);
};

// Export with simpler name for easier importing
export const getAllPlayers = getAllPlayersFromSupabase;
