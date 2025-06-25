import { saveToStorageSync } from './storageUtils';
import { User } from '@/types/userTypes';
import { Player } from '@/lib/mockData';
import { Tournament } from '@/lib/mockData';

/**
 * Initialize test data for the RO dashboard
 */
export const initializeTestData = () => {
  try {
    // Create test rating officer
    const ratingOfficer: User = {
      id: 'ro-test-1',
      email: 'ncro@ncr.com',
      fullName: 'Test Rating Officer',
      phoneNumber: '+2341234567890',
      state: 'Lagos',
      role: 'rating_officer',
      status: 'approved',
      registrationDate: new Date().toISOString(),
      lastModified: Date.now(),
      accessCode: 'RNCR25'
    };

    // Create test tournament organizer
    const organizer: User = {
      id: 'org-test-1',
      email: 'org@ncr.com',
      fullName: 'Test Tournament Organizer',
      phoneNumber: '+2341234567891',
      state: 'Abuja',
      role: 'tournament_organizer',
      status: 'pending',
      registrationDate: new Date().toISOString(),
      lastModified: Date.now(),
      password: 'password123'
    };

    // Create test players
    const testPlayers: Player[] = [
      {
        id: 'player-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+2341234567892',
        state: 'Lagos',
        city: 'Victoria Island',
        rating: 1500,
        rapidRating: 1450,
        blitzRating: 1400,
        status: 'pending',
        created_at: new Date().toISOString(),
        gamesPlayed: 0,
        gender: 'M',
        country: 'Nigeria',
        fideId: 'NGR001',
        title: undefined,
        titleVerified: false,
        birthYear: 1990,
        ratingHistory: [],
        rapidRatingHistory: [],
        blitzRatingHistory: [],
        tournamentResults: [],
        achievements: []
      },
      {
        id: 'player-2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '+2341234567893',
        state: 'Abuja',
        city: 'Wuse',
        rating: 1600,
        rapidRating: 1550,
        blitzRating: 1500,
        status: 'approved',
        created_at: new Date().toISOString(),
        gamesPlayed: 10,
        gender: 'F',
        country: 'Nigeria',
        fideId: 'NGR002',
        title: undefined,
        titleVerified: false,
        birthYear: 1992,
        ratingHistory: [],
        rapidRatingHistory: [],
        blitzRatingHistory: [],
        tournamentResults: [],
        achievements: []
      }
    ];

    // Create test tournaments
    const testTournaments: Tournament[] = [
      {
        id: 'tournament-1',
        name: 'Test Tournament 1',
        organizer_id: 'org-test-1',
        status: 'pending',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Lagos',
        city: 'Victoria Island',
        state: 'Lagos',
        time_control: '90+30',
        rounds: 5,
        participants: 0,
        current_round: 0,
        players: [],
        pairings: [],
        results: [],
        registration_open: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        description: 'Test tournament for development'
      },
      {
        id: 'tournament-2',
        name: 'Test Tournament 2',
        organizer_id: 'org-test-1',
        status: 'completed',
        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        location: 'Abuja',
        city: 'Wuse',
        state: 'Abuja',
        time_control: '90+30',
        rounds: 3,
        participants: 2,
        current_round: 3,
        players: testPlayers,
        pairings: [],
        results: [],
        registration_open: false,
        created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Completed test tournament'
      }
    ];

    // Save test data to storage
    saveToStorageSync('ncr_users', [ratingOfficer, organizer]);
    saveToStorageSync('ncr_players', testPlayers);
    saveToStorageSync('ncr_tournaments', testTournaments);

    console.log('✅ Test data initialized successfully');
    console.log('📊 Test data summary:');
    console.log(`   - Users: ${[ratingOfficer, organizer].length}`);
    console.log(`   - Players: ${testPlayers.length}`);
    console.log(`   - Tournaments: ${testTournaments.length}`);

    return true;
  } catch (error) {
    console.error('❌ Error initializing test data:', error);
    return false;
  }
};

// Auto-initialize test data in development
if (import.meta.env.DEV) {
  // Check if test data already exists
  const existingUsers = localStorage.getItem('ncr_users');
  if (!existingUsers || JSON.parse(existingUsers).length === 0) {
    console.log('🚀 Initializing test data for development...');
    initializeTestData();
  }
} 