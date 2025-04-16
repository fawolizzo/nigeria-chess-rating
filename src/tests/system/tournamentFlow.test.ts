
import { 
  setupSystemTest, 
  teardownSystemTest, 
  generateTestData,
  simulateRegistration,
  simulateLogin,
  TestUser
} from './setup';
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { Tournament, Player } from "@/types/tournamentTypes";

/**
 * System tests for the tournament management flow
 */
const runTournamentFlowTest = async (): Promise<boolean> => {
  try {
    logMessage(LogLevel.INFO, 'SystemTest', '===== STARTING TOURNAMENT FLOW TEST =====');
    
    // Setup test environment
    await setupSystemTest();
    
    // Generate test data
    const { ratingOfficer, organizer, testPlayers, testTournament } = generateTestData();
    
    // Register and log in the tournament organizer (approved)
    await simulateRegistration({ ...organizer, status: 'approved' });
    const organizerLoggedIn = await simulateLogin(
      organizer.email, 
      organizer.password, 
      organizer.role
    );
    if (!organizerLoggedIn) {
      throw new Error('Tournament organizer login failed');
    }
    
    // Set as current organizer
    const currentOrganizer = JSON.parse(localStorage.getItem('ncr_current_user') || 'null');
    
    // Initialize players and tournaments in localStorage
    const players: Player[] = testPlayers.map((player, index) => ({
      id: `player-${index + 1}`,
      name: player.name,
      rating: player.rating,
      nationalId: player.nationalId,
      state: player.state,
      status: player.status,
      gamesPlayed: 0,
      organizerId: currentOrganizer.id,
      registrationDate: new Date().toISOString(),
      lastModified: Date.now()
    }));
    
    localStorage.setItem('ncr_players', JSON.stringify(players));
    
    // Create a new tournament
    const tournament: Tournament = {
      id: `tournament-${Date.now()}`,
      name: testTournament.name,
      startDate: testTournament.startDate,
      endDate: testTournament.endDate,
      venue: testTournament.venue,
      state: testTournament.state,
      city: testTournament.city,
      rounds: testTournament.rounds,
      currentRound: 0,
      timeControl: testTournament.timeControl,
      organizerId: currentOrganizer.id,
      registrationOpen: testTournament.registrationOpen,
      status: testTournament.status,
      players: players.map(p => p.id).slice(0, 2), // Add only approved players
      pairings: [],
      createdAt: new Date().toISOString(),
      lastModified: Date.now()
    };
    
    const tournaments = [tournament];
    localStorage.setItem('ncr_tournaments', JSON.stringify(tournaments));
    
    // Simulate starting the tournament
    const updatedTournament = {
      ...tournament,
      status: 'ongoing',
      currentRound: 1
    };
    
    const updatedTournaments = [updatedTournament];
    localStorage.setItem('ncr_tournaments', JSON.stringify(updatedTournaments));
    
    // Simulate generating pairings for round 1
    const pairings = {
      roundNumber: 1,
      matches: [
        {
          whiteId: players[0].id,
          blackId: players[1].id,
          result: "*" // No result yet
        }
      ]
    };
    
    const tournamentWithPairings = {
      ...updatedTournament,
      pairings: [pairings]
    };
    
    const tournamentsWithPairings = [tournamentWithPairings];
    localStorage.setItem('ncr_tournaments', JSON.stringify(tournamentsWithPairings));
    
    // Simulate recording results
    const pairingsWithResults = {
      ...pairings,
      matches: [
        {
          whiteId: players[0].id,
          blackId: players[1].id,
          result: "1-0" // White wins
        }
      ]
    };
    
    const tournamentWithResults = {
      ...tournamentWithPairings,
      pairings: [pairingsWithResults]
    };
    
    const tournamentsWithResults = [tournamentWithResults];
    localStorage.setItem('ncr_tournaments', JSON.stringify(tournamentsWithResults));
    
    // Simulate completing the tournament
    const completedTournament = {
      ...tournamentWithResults,
      status: 'completed',
      currentRound: 1
    };
    
    const completedTournaments = [completedTournament];
    localStorage.setItem('ncr_tournaments', JSON.stringify(completedTournaments));
    
    // Log in as rating officer to approve the tournament
    await simulateRegistration(ratingOfficer);
    const officerLoggedIn = await simulateLogin(
      ratingOfficer.email, 
      ratingOfficer.accessCode!, 
      ratingOfficer.role
    );
    
    if (!officerLoggedIn) {
      throw new Error('Rating officer login failed');
    }
    
    // Simulate processing tournament for ratings
    const processedTournament = {
      ...completedTournament,
      status: 'processed'
    };
    
    const processedTournaments = [processedTournament];
    localStorage.setItem('ncr_tournaments', JSON.stringify(processedTournaments));
    
    // Cleanup
    await teardownSystemTest();
    
    logMessage(LogLevel.INFO, 'SystemTest', '===== TOURNAMENT FLOW TEST PASSED =====');
    return true;
  } catch (error) {
    logMessage(LogLevel.ERROR, 'SystemTest', '===== TOURNAMENT FLOW TEST FAILED =====', error);
    await teardownSystemTest();
    return false;
  }
};

export { runTournamentFlowTest };
