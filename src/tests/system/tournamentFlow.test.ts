import { describe, it, expect } from '@jest/globals';
import { Tournament, Player } from "@/lib/mockData";
import { 
  createTournament, 
  getAllTournaments, 
  getTournamentById,
  addPlayerToTournament 
} from "@/services/tournamentService";

describe('Tournament Flow Tests', () => {
  let mockTournament: Tournament;
  let mockPlayer: Player;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    
    mockPlayer = {
      id: 'player-1',
      name: 'Test Player',
      email: 'test@example.com',
      phone: '+234567890',
      state: 'Lagos',
      city: 'Lagos',
      rating: 1200,
      rapidRating: 1150,
      blitzRating: 1100,
      status: 'approved',
      ratingStatus: 'provisional',
      gamesPlayed: 5,
      created_at: new Date().toISOString(),
      gender: 'M',
      country: 'Nigeria'
    };

    mockTournament = {
      id: 'test-tournament-1',
      name: 'Test Tournament',
      description: 'A test tournament',
      start_date: '2024-12-20',
      end_date: '2024-12-21',
      location: 'Test Location',
      city: 'Lagos',
      state: 'Lagos',
      time_control: 'Classical',
      rounds: 5,
      organizer_id: 'test-organizer',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      current_round: 1,
      participants: 0,
      registration_open: true,
      players: [],
      pairings: [],
      results: []
    };
  });

  it('should create a tournament', async () => {
    const tournament = await createTournament(mockTournament);
    expect(tournament).toBeDefined();
    expect(tournament.name).toBe(mockTournament.name);
  });

  it('should retrieve all tournaments', async () => {
    await createTournament(mockTournament);
    const tournaments = await getAllTournaments();
    expect(tournaments).toBeDefined();
    expect(tournaments.length).toBeGreaterThan(0);
  });

  it('should retrieve a tournament by ID', async () => {
    await createTournament(mockTournament);
    const tournament = await getTournamentById(mockTournament.id);
    expect(tournament).toBeDefined();
    expect(tournament?.id).toBe(mockTournament.id);
  });

  it('should add a player to a tournament', async () => {
    await createTournament(mockTournament);
    const success = await addPlayerToTournament(mockTournament.id, [mockPlayer]);
    expect(success).toBe(true);

    const tournament = await getTournamentById(mockTournament.id);
    expect(tournament).toBeDefined();
    expect(tournament?.players).toBeDefined();
    expect(tournament?.players?.length).toBe(1);
    expect(tournament?.players?.[0].id).toBe(mockPlayer.id);
  });
});
