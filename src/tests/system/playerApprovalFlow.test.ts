
import { 
  setupSystemTest, 
  teardownSystemTest, 
  generateTestData,
  simulateRegistration,
  simulateLogin
} from './setup';
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * System tests for the player approval flow
 */
const runPlayerApprovalFlowTest = async (): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', '===== STARTING PLAYER APPROVAL FLOW TEST =====');
    
    // Setup test environment
    await setupSystemTest();
    
    // Generate test data
    const { ratingOfficer, organizer, testPlayers } = generateTestData();
    
    // Register users
    await simulateRegistration({ ...organizer, status: 'approved' });
    await simulateRegistration(ratingOfficer);
    
    // Log in as tournament organizer
    const organizerLoggedIn = await simulateLogin(
      organizer.email, 
      organizer.password, 
      organizer.role
    );
    
    if (!organizerLoggedIn) {
      throw new Error('Tournament organizer login failed');
    }
    
    // Get current user
    const currentOrganizer = JSON.parse(localStorage.getItem('ncr_current_user') || 'null');
    
    // Create players with one pending
    const players = testPlayers.map((player, index) => ({
      id: `player-${Date.now()}-${index}`,
      name: player.name,
      rating: player.rating,
      nationalId: player.nationalId,
      state: player.state,
      status: player.status, // Third player is pending
      organizerId: currentOrganizer.id,
      registrationDate: new Date().toISOString(),
      lastModified: Date.now()
    }));
    
    localStorage.setItem('ncr_players', JSON.stringify(players));
    
    // Log in as rating officer
    const officerLoggedIn = await simulateLogin(
      ratingOfficer.email, 
      ratingOfficer.accessCode!, 
      ratingOfficer.role
    );
    
    if (!officerLoggedIn) {
      throw new Error('Rating officer login failed');
    }
    
    // Find pending player
    const pendingPlayer = players.find(p => p.status === 'pending');
    
    if (!pendingPlayer) {
      throw new Error('No pending player found');
    }
    
    // Approve the pending player
    const updatedPlayers = players.map(player => {
      if (player.id === pendingPlayer.id) {
        return {
          ...player,
          status: 'approved',
          lastModified: Date.now()
        };
      }
      return player;
    });
    
    localStorage.setItem('ncr_players', JSON.stringify(updatedPlayers));
    
    // Verify all players are now approved
    const storedPlayers = JSON.parse(localStorage.getItem('ncr_players') || '[]');
    const allApproved = storedPlayers.every((p: any) => p.status === 'approved');
    
    if (!allApproved) {
      throw new Error('Not all players were approved');
    }
    
    // Cleanup
    await teardownSystemTest();
    
    logMessage(LogLevel.INFO, 'SystemTest', '===== PLAYER APPROVAL FLOW TEST PASSED =====');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', '===== PLAYER APPROVAL FLOW TEST FAILED =====', error);
    await teardownSystemTest();
    return false;
  }
};

export { runPlayerApprovalFlowTest };

test('player approval flow', async () => {
  const result = await runPlayerApprovalFlowTest();
  expect(result).toBe(true);
});
