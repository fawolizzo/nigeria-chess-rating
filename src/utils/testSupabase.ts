import { supabase } from '@/integrations/supabase/client';

export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');

  try {
    // Test 1: Check if client is initialized
    console.log('📡 Supabase client initialized:', !!supabase);
    console.log('🔗 Supabase URL:', supabase.supabaseUrl);

    // Test 2: Test basic connection
    const { data, error } = await supabase
      .from('players')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Supabase connection error:', error);
      return {
        connected: false,
        error: error.message,
        details: error,
      };
    }

    console.log('✅ Supabase connection successful!');
    console.log('📊 Players table count:', data);

    // Test 3: Check table structure
    const { data: sampleData, error: sampleError } = await supabase
      .from('players')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.warn('⚠️ Could not fetch sample data:', sampleError);
    } else {
      console.log('📋 Sample player data structure:', sampleData);
    }

    return {
      connected: true,
      playerCount: data,
      sampleData: sampleData,
    };
  } catch (error) {
    console.error('❌ Supabase test failed:', error);
    return {
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    };
  }
};

export const testSupabaseAuth = async () => {
  console.log('🔍 Testing Supabase Auth...');

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Auth error:', error);
      return { authenticated: false, error: error.message };
    }

    console.log('🔐 Auth session:', session ? 'Active' : 'None');
    return { authenticated: !!session, session };
  } catch (error) {
    console.error('❌ Auth test failed:', error);
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
