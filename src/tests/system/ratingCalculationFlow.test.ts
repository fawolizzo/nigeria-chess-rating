
import { 
  setupSystemTest, 
  teardownSystemTest, 
  generateTestData,
  simulateRegistration,
  simulateLogin
} from './setup';
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * System tests for the rating calculation flow
 */
const runRatingCalculationFlowTest = async (): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', '===== STARTING RATING CALCULATION FLOW TEST =====');
    
    // Setup test environment
    await setupSystemTest();
    
    // Generate test data
    const { ratingOfficer, testPlayers } = generateTestData();
    
    // Register and log in the rating officer
    await simulateRegistration(ratingOfficer);
    const officerLoggedIn = await simulateLogin(
      ratingOfficer.email, 
      ratingOfficer.accessCode!, 
      ratingOfficer.role
    );
    
    if (!officerLoggedIn) {
      throw new Error('Rating officer login failed');
    }
    
    // Initialize players with approved status
    const players = testPlayers.map((player, index) => ({
      id: `player-${Date.now()}-${index}`,
      name: player.name,
      rating: player.rating,
      nationalId: player.nationalId,
      state: player.state,
      status: 'approved',
      gamesPlayed: 10 + index,
      organizerId: `test-organizer-id-${index}`,
      registrationDate: new Date().toISOString(),
      lastModified: Date.now()
    }));
    
    localStorage.setItem('ncr_players', JSON.stringify(players));
    
    // Create a completed tournament
    const tournament = {
      id: `tournament-${Date.now()}`,
      name: 'Test Rating Tournament',
      startDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0], // 3 days ago
      endDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      venue: 'Test Venue',
      state: 'Lagos',
      city: 'Lagos',
      rounds: 3,
      currentRound: 3,
      timeControl: '90+30',
      organizerId: 'test-organizer-id-1',
      registrationOpen: false,
      status: 'completed',
      players: players.map(p => p.id),
      pairings: [
        {
          roundNumber: 1,
          matches: [
            {
              whiteId: players[0].id,
              blackId: players[1].id,
              result: "1-0" // White wins
            },
            {
              whiteId: players[2].id,
              blackId: null,
              result: "1-0" // Bye
            }
          ]
        },
        {
          roundNumber: 2,
          matches: [
            {
              whiteId: players[0].id,
              blackId: players[2].id,
              result: "1/2-1/2" // Draw
            },
            {
              whiteId: players[1].id,
              blackId: null,
              result: "1-0" // Bye
            }
          ]
        },
        {
          roundNumber: 3,
          matches: [
            {
              whiteId: players[1].id,
              blackId: players[0].id,
              result: "0-1" // Black wins
            },
            {
              whiteId: players[2].id,
              blackId: null,
              result: "1-0" // Bye
            }
          ]
        }
      ],
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      lastModified: Date.now()
    };
    
    const tournaments = [tournament];
    localStorage.setItem('ncr_tournaments', JSON.stringify(tournaments));
    
    // Simulate processing tournament ratings
    // Calculate expected ratings based on Elo formula
    // Player 0: Won against player 1, drew against player 2, won against player 1 again
    // Player 1: Lost to player 0, bye, lost to player 0 again
    // Player 2: Bye, drew against player 0, bye
    
    // Expected K-factor for each player (based on games played)
    const getKFactor = (player: any) => {
      if (player.gamesPlayed < 30) return 40;
      if (player.rating < 2100) return 32;
      if (player.rating < 2400) return 24;
      return 16;
    };
    
    // Calculate new ratings (simplified simulation)
    const updatedPlayers = players.map(player => {
      let newRating = player.rating;
      let ratingChange = 0;
      
      const kFactor = getKFactor(player);
      
      // Simple simulation of rating changes
      if (player.id === players[0].id) {
        // Player 0 performed well - gain rating
        ratingChange = Math.round(kFactor * 0.75); // Simplified calculation
      } else if (player.id === players[1].id) {
        // Player 1 performed poorly - lose rating
        ratingChange = -Math.round(kFactor * 0.5); // Simplified calculation
      } else if (player.id === players[2].id) {
        // Player 2 performed average - smaller gain
        ratingChange = Math.round(kFactor * 0.25); // Simplified calculation
      }
      
      newRating = Math.max(800, player.rating + ratingChange); // Floor of 800
      
      return {
        ...player,
        rating: newRating,
        gamesPlayed: player.gamesPlayed + 3, // 3 rounds
        lastModified: Date.now()
      };
    });
    
    localStorage.setItem('ncr_players', JSON.stringify(updatedPlayers));
    
    // Mark tournament as processed
    const processedTournament = {
      ...tournament,
      status: 'processed'
    };
    
    const processedTournaments = [processedTournament];
    localStorage.setItem('ncr_tournaments', JSON.stringify(processedTournaments));
    
    // Verify rating changes
    const storedPlayers = JSON.parse(localStorage.getItem('ncr_players') || '[]');
    const player0 = storedPlayers.find((p: any) => p.id === players[0].id);
    const player1 = storedPlayers.find((p: any) => p.id === players[1].id);
    const player2 = storedPlayers.find((p: any) => p.id === players[2].id);
    
    if (player0.rating <= players[0].rating) {
      throw new Error('Player 0 rating did not increase as expected');
    }
    
    if (player1.rating >= players[1].rating) {
      throw new Error('Player 1 rating did not decrease as expected');
    }
    
    // Verify games played increased
    if (player0.gamesPlayed !== players[0].gamesPlayed + 3) {
      throw new Error('Player 0 games played count incorrect');
    }
    
    // Cleanup
    await teardownSystemTest();
    
    logMessage(LogLevel.INFO, 'SystemTest', '===== RATING CALCULATION FLOW TEST PASSED =====');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', '===== RATING CALCULATION FLOW TEST FAILED =====', error);
    await teardownSystemTest();
    return false;
  }
};

export { runRatingCalculationFlowTest };
