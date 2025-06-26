import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

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
  city: data.city,
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
  tournamentResults: []
});

export const getAllPlayersFromSupabase = async ({ status }: { status?: string } = {}): Promise<Player[]> => {
  let query = supabase.from('players').select('*');
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    return [];
  }
  const transformedData = data.map(transformSupabasePlayer);
  const sortedData = transformedData.sort((a, b) => (b.rating || 800) - (a.rating || 800));
  return sortedData;
};

export const getAllUsers = async (): Promise<Player[]> => {
  const { data, error } = await supabase.from('players').select('*');
  if (error || !Array.isArray(data)) {
    return [];
  }
  return data.map(transformSupabasePlayer);
};

export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  const { data, error } = await supabase.from('players').select('*').eq('id', id).single();
  if (error) {
    return null;
  }
  return transformSupabasePlayer(data);
};
