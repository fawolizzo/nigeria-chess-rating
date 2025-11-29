import { useState, useEffect } from 'react';
import { Tournament } from '@/types/tournamentTypes';
import { Player, Pairing, Result } from '@/lib/mockData';
import { TournamentFormData } from '@/components/tournament/form/TournamentFormSchema';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/user/index';
import {
  getAllTournaments,
  getTournamentsByOrganizer,
  createTournament as createTournamentInSupabase,
  updateTournament,
} from '@/services/tournament/tournamentService';

export interface TournamentManagerHook {
  tournaments: Tournament[];
  isLoading: boolean;
  loadError: string;
  createTournament: (
    tournamentData: TournamentFormData,
    customTimeControl: string,
    isCustomTimeControl: boolean
  ) => Promise<boolean>;
  loadTournaments: () => Promise<void>;
  retry: () => void;
  generatePairings: (tournamentId: string) => Promise<void>;
  recordResult: (
    tournamentId: string,
    pairingId: string,
    result: string
  ) => Promise<void>;
  addPlayerToTournament: (
    tournamentId: string,
    players: Player[]
  ) => Promise<void>;
  removePlayerFromTournament: (
    tournamentId: string,
    playerId: string
  ) => Promise<void>;
  toggleRegistration: (tournamentId: string) => Promise<void>;
  startTournament: (tournamentId: string) => Promise<void>;
  completeTournament: (tournamentId: string) => Promise<void>;
  nextRound: (tournamentId: string) => Promise<void>;
}

export const useTournamentManager = (): TournamentManagerHook => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const { toast } = useToast();
  const { currentUser } = useUser();

  const loadTournaments = async () => {
    try {
      setIsLoading(true);
      setLoadError('');

      console.log('🔍 Loading tournaments from Supabase...');

      // Load tournaments based on user role
      let tournamentsData: Tournament[] = [];

      if (currentUser?.role === 'rating_officer') {
        // Rating officers see all tournaments
        tournamentsData = await getAllTournaments();
      } else if (currentUser?.role === 'tournament_organizer') {
        // Tournament organizers see only their tournaments
        tournamentsData = await getTournamentsByOrganizer(currentUser.id);
      } else {
        // Default to all tournaments for other users
        tournamentsData = await getAllTournaments();
      }

      console.log(`✅ Loaded ${tournamentsData.length} tournaments`);
      setTournaments(tournamentsData);
    } catch (error) {
      console.error('❌ Error loading tournaments:', error);
      setLoadError('Failed to load tournaments from database');
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTournaments();
  }, []);

  const createTournament = async (
    tournamentData: TournamentFormData,
    customTimeControl: string,
    isCustomTimeControl: boolean
  ): Promise<boolean> => {
    try {
      if (!currentUser) {
        toast({
          title: 'Error',
          description: 'You must be logged in to create a tournament',
          variant: 'destructive',
        });
        return false;
      }

      const timeControl = isCustomTimeControl
        ? customTimeControl
        : tournamentData.timeControl || '90+30';

      // Use the current user's ID (should exist in organizers table)
      const organizerId = currentUser.id;
      console.log('🔍 Using current user ID as organizer_id:', organizerId);

      // Validate that we have a proper organizer ID
      if (!organizerId) {
        throw new Error(
          'No organizer ID available. Please ensure you are logged in as a Tournament Organizer.'
        );
      }

      const tournamentToCreate = {
        name: tournamentData.name || '',
        description: tournamentData.description || '',
        start_date: tournamentData.startDate?.toISOString().split('T')[0] || '',
        end_date: tournamentData.endDate?.toISOString().split('T')[0] || '',
        location: tournamentData.location || '',
        city: tournamentData.city || '',
        state: tournamentData.state || '',
        organizer_id: organizerId,
        status: 'approved' as const, // Auto-approved for approved organizers
        rounds: tournamentData.rounds || 5,
        current_round: 1,
        time_control: timeControl,
        participants: 0,
        registration_open: tournamentData.registrationOpen ?? true,
        players: [],
        pairings: [],
        results: [],
      };

      console.log(
        '🏆 Tournament data to create:',
        JSON.stringify(tournamentToCreate, null, 2)
      );

      console.log('🏆 Creating tournament via Supabase service...');
      const newTournament =
        await createTournamentInSupabase(tournamentToCreate);

      // Update local state
      setTournaments((prev) => [newTournament as Tournament, ...prev]);

      toast({
        title: 'Tournament Created',
        description: `${newTournament.name} has been created successfully and is ready for player registration.`,
      });

      return true;
    } catch (error) {
      console.error('❌ Error creating tournament:', error);
      toast({
        title: 'Error',
        description: 'Failed to create tournament. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const generatePairings = async (tournamentId: string) => {
    // Implementation for generating pairings
    console.log('Generating pairings for tournament:', tournamentId);
  };

  const recordResult = async (
    tournamentId: string,
    pairingId: string,
    result: string
  ) => {
    // Implementation for recording results
    console.log('Recording result:', { tournamentId, pairingId, result });
  };

  const addPlayerToTournament = async (
    tournamentId: string,
    players: Player[]
  ) => {
    // Implementation for adding players
    console.log('Adding players to tournament:', { tournamentId, players });
  };

  const removePlayerFromTournament = async (
    tournamentId: string,
    playerId: string
  ) => {
    // Implementation for removing player
    console.log('Removing player from tournament:', { tournamentId, playerId });
  };

  const toggleRegistration = async (tournamentId: string) => {
    // Implementation for toggling registration
    console.log('Toggling registration for tournament:', tournamentId);
  };

  const startTournament = async (tournamentId: string) => {
    // Implementation for starting tournament
    console.log('Starting tournament:', tournamentId);
  };

  const completeTournament = async (tournamentId: string) => {
    // Implementation for completing tournament
    console.log('Completing tournament:', tournamentId);
  };

  const nextRound = async (tournamentId: string) => {
    // Implementation for next round
    console.log('Moving to next round:', tournamentId);
  };

  const retry = () => {
    loadTournaments();
  };

  return {
    tournaments,
    isLoading,
    loadError,
    createTournament,
    loadTournaments,
    retry,
    generatePairings,
    recordResult,
    addPlayerToTournament,
    removePlayerFromTournament,
    toggleRegistration,
    startTournament,
    completeTournament,
    nextRound,
  };
};
