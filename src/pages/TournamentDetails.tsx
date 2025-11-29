import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament } from '@/types/tournamentTypes';
import { Player, Pairing, Result } from '@/lib/mockData';
import { useUser } from '@/contexts/user/index';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import TournamentHeader from '@/components/tournament/TournamentHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PlayersTab from '@/components/tournament/PlayersTab';
import PairingsTab from '@/components/tournament/PairingsTab';

export default function TournamentDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const {
    generatePairings,
    recordResult,
    addPlayerToTournament,
    removePlayerFromTournament,
    toggleRegistration,
    startTournament,
    completeTournament,
    nextRound,
  } = useTournamentManager();

  useEffect(() => {
    if (!id) return;

    const loadTournament = async () => {
      try {
        console.log('🔍 Loading tournament details for ID:', id);

        // Load tournament data from database (same as TournamentManagement)
        let foundTournament = null;

        try {
          const { getTournamentById } = await import(
            '@/services/tournament/tournamentService'
          );
          foundTournament = await getTournamentById(id);
        } catch (dbError) {
          console.log('Database not available, using mock tournament data');
        }

        if (foundTournament) {
          console.log(
            '✅ Tournament details loaded successfully:',
            foundTournament.name
          );
          setTournament(foundTournament);
        } else {
          // Create mock tournament data for development/testing (same as TournamentManagement)
          console.log(
            'Creating mock tournament data for details page, ID:',
            id
          );
          const mockTournament: Tournament = {
            id: id,
            name: 'Lagos State Championship 2025',
            description:
              'Annual chess championship for Lagos State - Mock Tournament for Testing',
            location: 'National Theatre Lagos',
            city: 'Lagos',
            state: 'Lagos',
            start_date: '2025-02-15',
            end_date: '2025-02-17',
            time_control: '90+30',
            rounds: 7,
            status: 'approved',
            organizer_id: 'mock-organizer-1',
            registration_open: true,
            participants: 0,
            current_round: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            players: [],
            pairings: [],
            results: [],
          };

          console.log(
            '✅ Mock tournament created for details:',
            mockTournament.name
          );
          setTournament(mockTournament);
        }
      } catch (error) {
        console.error('❌ Error loading tournament details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tournament details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTournament();
  }, [id, toast]);

  // Check if current user is the organizer
  const isOrganizer =
    currentUser && tournament && currentUser.id === tournament.organizer_id;
  const canStartTournament =
    tournament?.status === 'approved' &&
    (tournament?.players || []).length >= 2 &&
    !tournament.registration_open;

  const handleAddPlayer = async (players: Player[]) => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      await addPlayerToTournament(tournament.id, players);
      // Reload tournament data
      toast({
        title: 'Success',
        description: 'Players added successfully',
      });
    } catch (error) {
      console.error('Error adding player:', error);
      toast({
        title: 'Error',
        description: 'Failed to add players',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePlayer = async (playerId: string) => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      await removePlayerFromTournament(tournament.id, playerId);
      toast({
        title: 'Success',
        description: 'Player removed successfully',
      });
    } catch (error) {
      console.error('Error removing player:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove player',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      await toggleRegistration(tournament.id);
      toast({
        title: 'Success',
        description: 'Registration status updated',
      });
    } catch (error) {
      console.error('Error toggling registration:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTournament = async () => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      await startTournament(tournament.id);
      toast({
        title: 'Success',
        description: 'Tournament started',
      });
    } catch (error) {
      console.error('Error starting tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      await completeTournament(tournament.id);
      toast({
        title: 'Success',
        description: 'Tournament completed',
      });
    } catch (error) {
      console.error('Error completing tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <div className="text-center">Loading tournament details...</div>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Tournament Not Found</h1>
            <p className="text-gray-600 mb-4">
              The tournament you're looking for doesn't exist.
            </p>
            <button
              onClick={() => navigate('/tournaments')}
              className="bg-nigeria-green text-white px-4 py-2 rounded hover:bg-opacity-90"
            >
              Back to Tournaments
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />

      <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
        <TournamentHeader
          tournament={tournament}
          onToggleRegistration={handleToggleRegistration}
          onStartTournament={handleStartTournament}
          onCompleteTournament={handleCompleteTournament}
          canStartTournament={canStartTournament}
          isProcessing={isProcessing}
        />

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Tournament Details
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Date:</span>{' '}
                  {tournament.start_date} - {tournament.end_date}
                </p>
                <p>
                  <span className="font-medium">Location:</span>{' '}
                  {tournament.location}
                </p>
                <p>
                  <span className="font-medium">State:</span> {tournament.state}
                </p>
                <p>
                  <span className="font-medium">City:</span> {tournament.city}
                </p>
                <p>
                  <span className="font-medium">Rounds:</span>{' '}
                  {tournament.rounds}
                </p>
                <p>
                  <span className="font-medium">Time Control:</span>{' '}
                  {tournament.time_control}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Registration
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {tournament.registration_open ? 'Open' : 'Closed'}
                </p>
                <p>
                  <span className="font-medium">Participants:</span>{' '}
                  {tournament.participants || 0}
                </p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Progress
              </h3>
              <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span className="font-medium">Status:</span>{' '}
                  {tournament.status}
                </p>
                <p>
                  <span className="font-medium">Current Round:</span>{' '}
                  {tournament.current_round}/{tournament.rounds}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="players">
                Players ({(tournament.players || []).length})
              </TabsTrigger>
              <TabsTrigger value="pairings">Pairings & Results</TabsTrigger>
            </TabsList>

            <TabsContent value="players" className="space-y-4">
              <PlayersTab
                tournamentId={tournament.id}
                tournamentStatus={tournament.status}
                registeredPlayers={
                  Array.isArray(tournament.players) ? tournament.players : []
                }
                allPlayers={
                  Array.isArray(tournament.players) ? tournament.players : []
                }
                playerIds={
                  Array.isArray(tournament.players)
                    ? tournament.players.map((p) => p.id)
                    : []
                }
                onCreatePlayer={() => {}}
                onAddPlayers={handleAddPlayer}
                onRemovePlayer={handleRemovePlayer}
                isProcessing={isProcessing}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </TabsContent>

            <TabsContent value="pairings" className="space-y-4">
              <PairingsTab
                tournament={tournament}
                onGeneratePairings={() => generatePairings(tournament.id)}
                onRecordResult={(pairingId, result) => recordResult(tournament.id, pairingId, result)}
                onNextRound={() => nextRound(tournament.id)}
                isOrganizer={isOrganizer || false}
                isProcessing={isProcessing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
