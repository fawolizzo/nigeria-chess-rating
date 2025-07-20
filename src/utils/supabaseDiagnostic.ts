import { supabaseAdmin } from '@/integrations/supabase/adminClient';

export const diagnoseSupabase = async () => {
  try {
    console.log('🔍 Diagnosing Supabase connection and table structure...');

    // Test 1: Basic connection
    console.log('1️⃣ Testing basic Supabase connection...');
    const { data: connectionTest, error: connectionError } = await supabaseAdmin
      .from('players')
      .select('count', { count: 'exact', head: true });

    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return {
        success: false,
        error: 'Connection failed',
        details: connectionError,
      };
    }

    console.log('✅ Connection successful. Player count:', connectionTest);

    // Test 2: Check table structure by trying to select all columns
    console.log('2️⃣ Checking table structure...');
    const { data: structureTest, error: structureError } = await supabaseAdmin
      .from('players')
      .select('*')
      .limit(1);

    if (structureError) {
      console.error('❌ Structure test failed:', structureError);
      return {
        success: false,
        error: 'Structure check failed',
        details: structureError,
      };
    }

    console.log('✅ Table structure check passed');
    if (structureTest && structureTest.length > 0) {
      console.log('📋 Sample player structure:', Object.keys(structureTest[0]));
    }

    // Test 3: Try a simple insert with minimal data
    console.log('3️⃣ Testing simple insert...');
    const testPlayer = {
      name: 'Test Player ' + Date.now(),
      email: `test${Date.now()}@example.com`,
      status: 'approved',
    };

    const { data: insertTest, error: insertError } = await supabaseAdmin
      .from('players')
      .insert([testPlayer])
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError);
      return { success: false, error: 'Insert failed', details: insertError };
    }

    console.log('✅ Insert test passed:', insertTest);

    // Clean up test player
    if (insertTest && insertTest.length > 0) {
      await supabaseAdmin.from('players').delete().eq('id', insertTest[0].id);
      console.log('🧹 Cleaned up test player');
    }

    return { success: true, message: 'All tests passed' };
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { success: false, error: 'Diagnostic failed', details: error };
  }
};

export const checkPlayersTable = async () => {
  try {
    console.log('🔍 Checking existing players in database...');

    const { data, error } = await supabaseAdmin
      .from('players')
      .select('id, name, email, status, rating, fide_id')
      .limit(10);

    if (error) {
      console.error('❌ Error checking players:', error);
      return [];
    }

    console.log(`📊 Found ${data?.length || 0} players in database`);
    if (data && data.length > 0) {
      console.log('📋 Sample players:');
      data.forEach((player) => {
        console.log(
          `  - ${player.name} (${player.email}) - Status: ${player.status}, Rating: ${player.rating || 'Unrated'}`
        );
      });
    }

    return data || [];
  } catch (error) {
    console.error('❌ Error checking players table:', error);
    return [];
  }
};
