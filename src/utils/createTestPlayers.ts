import { supabaseAdmin } from '@/integrations/supabase/adminClient';

export const createTestPlayersInSupabase = async () => {
  try {
    console.log('🔧 Creating test players in Supabase...');

    // First, check if test players already exist
    const { data: existingPlayers, error: checkError } = await supabaseAdmin
      .from('players')
      .select('fide_id')
      .in('fide_id', ['TEST001', 'TEST002', 'TEST003']);

    if (checkError) {
      console.error('❌ Error checking existing players:', checkError);
      throw checkError;
    }

    if (existingPlayers && existingPlayers.length > 0) {
      console.log('ℹ️ Test players already exist, skipping creation');
      return existingPlayers;
    }

    const testPlayers = [
      {
        name: 'John Doe',
        email: 'john.doe@test.example.com',
        phone: '+2341234567890',
        state: 'Lagos',
        city: 'Victoria Island',
        rating: 1500,
        rapid_rating: 1450,
        blitz_rating: 1400,
        status: 'approved',
        games_played: 5,
        rapid_games_played: 3,
        blitz_games_played: 8,
        gender: 'M',
        fide_id: 'TEST001',
        birth_year: 1990,
        title: null,
        title_verified: false,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@test.example.com',
        phone: '+2341234567891',
        state: 'Abuja',
        city: 'Wuse',
        rating: 1600,
        rapid_rating: 1550,
        blitz_rating: 1500,
        status: 'approved',
        games_played: 10,
        rapid_games_played: 7,
        blitz_games_played: 12,
        gender: 'F',
        fide_id: 'TEST002',
        birth_year: 1992,
        title: null,
        title_verified: false,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@test.example.com',
        phone: '+2341234567892',
        state: 'Kano',
        city: 'Kano',
        rating: 1750,
        rapid_rating: 1700,
        blitz_rating: 1650,
        status: 'approved',
        games_played: 25,
        rapid_games_played: 20,
        blitz_games_played: 30,
        gender: 'M',
        fide_id: 'TEST003',
        birth_year: 1988,
        title: 'CM',
        title_verified: true,
        created_at: new Date().toISOString(),
      },
    ];

    console.log('📝 Inserting test players:', testPlayers.length);

    const { data, error } = await supabaseAdmin
      .from('players')
      .insert(testPlayers)
      .select();

    if (error) {
      console.error('❌ Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw error;
    }

    console.log('✅ Successfully created test players:', data?.length || 0);
    return data;
  } catch (error) {
    console.error('❌ Failed to create test players:', error);
    throw error;
  }
};

// Function to check if players exist
export const checkPlayersInSupabase = async () => {
  try {
    const { data, error } = await supabaseAdmin
      .from('players')
      .select('id, name, email, status')
      .eq('status', 'approved');

    if (error) {
      console.error('❌ Error checking players:', error);
      return [];
    }

    console.log('📊 Found approved players:', data?.length || 0);
    return data || [];
  } catch (error) {
    console.error('❌ Error checking players:', error);
    return [];
  }
};
