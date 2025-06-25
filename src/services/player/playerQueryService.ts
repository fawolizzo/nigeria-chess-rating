import { Player } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";

export const getAllPlayersFromSupabase = async (filters: {
  state?: string;
  city?: string;
  status?: string;
} = {}): Promise<Player[]> => {
  let query = supabase.from('players').select('*');

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  if (filters.state) {
    query = query.eq('state', filters.state);
  }
  if (filters.city) {
    query = query.eq('city', filters.city);
  }

  const { data, error } = await query;
  if (error || !Array.isArray(data)) {
    console.error("❌ Error fetching players from Supabase:", error);
    return [];
  }
  // Optionally sort by rating
  return data.sort((a, b) => (b.rating || 800) - (a.rating || 800));
};

export const getAllUsers = async (): Promise<Player[]> => {
  const { data, error } = await supabase.from('players').select('*');
  if (error || !Array.isArray(data)) {
    console.error("❌ Error fetching all users from Supabase:", error);
    return [];
  }
  return data;
};

export const getPlayerByIdFromSupabase = async (id: string): Promise<Player | null> => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !data) {
    console.error("❌ Error getting player from Supabase:", error);
    return null;
  }
  return data as Player;
};
