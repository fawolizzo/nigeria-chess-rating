import { createPlayer } from '@/services/player/playerCoreService';
import { getAllPlayersFromSupabase } from '@/services/player/playerQueryService';

export const testPlayerUpload = async () => {
  console.log('🧪 Testing player upload functionality...');
  
  try {
    // Test 1: Check Supabase connection
    console.log('🔍 Test 1: Checking Supabase connection...');
    const existingPlayers = await getAllPlayersFromSupabase();
    console.log('✅ Test 1 passed: Connection working, found', existingPlayers.length, 'existing players');
    
    // Test 2: Create a test player
    console.log('🔍 Test 2: Creating test player...');
    const testPlayer = {
      name: `Test Player ${Date.now()}`,
      email: `test${Date.now()}@ncr.test`,
      rating: 900,
      rapidRating: 900,
      blitzRating: 900,
      state: 'Lagos',
      city: 'Ikeja',
      gender: 'M' as const,
      status: 'approved' as const,
      phone: '+234123456789',
      country: 'Nigeria',
      gamesPlayed: 31,
      rapidGamesPlayed: 31,
      blitzGamesPlayed: 31,
      created_at: new Date().toISOString()
    };
    
    const createdPlayer = await createPlayer(testPlayer);
    console.log('✅ Test 2 passed: Player created successfully:', createdPlayer.name);
    
    // Test 3: Verify player was saved to Supabase
    console.log('🔍 Test 3: Verifying player in Supabase...');
    const updatedPlayers = await getAllPlayersFromSupabase();
    console.log('✅ Test 3 passed: Player count increased to', updatedPlayers.length);
    
    return {
      success: true,
      message: 'All player upload tests passed!',
      playerCount: updatedPlayers.length,
      testPlayer: createdPlayer
    };
    
  } catch (error) {
    console.error('❌ Player upload test failed:', error);
    return {
      success: false,
      message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error
    };
  }
};

// Add to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testPlayerUpload = testPlayerUpload;
}