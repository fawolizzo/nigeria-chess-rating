import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tournament, Player, Pairing, Result } from '@/lib/mockData';
import { useUser } from '@/contexts/UserContext';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import TournamentHeader from '@/components/tournament/TournamentHeader';
import RoundController from '@/components/tournament/RoundController';
import ResultRecorder from '@/components/ResultRecorder';
import StandingsTable from '@/components/StandingsTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PlayersTab from '@/components/tournament/PlayersTab';

export default function TournamentManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser } = useUser();
  const { toast } = useToast();

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [allAvailablePlayers, setAllAvailablePlayers] = useState<Player[]>([]);
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
        console.log('🔍 Loading tournament with ID:', id);

        // Load tournament data
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
            '✅ Tournament loaded successfully:',
            foundTournament.name
          );
          setTournament(foundTournament);
          const players = foundTournament.players || [];
          setSelectedPlayers(Array.isArray(players) ? players : []);
        } else {
          // Create mock tournament data for development/testing
          console.log('Creating mock tournament data for ID:', id);
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

          console.log('✅ Mock tournament created:', mockTournament.name);
          setTournament(mockTournament);
          setSelectedPlayers([]);
        }

        // Load all available players for the AddPlayersDialog
        await loadAllAvailablePlayers();
      } catch (error) {
        console.error('❌ Error loading tournament:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tournament details. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    const loadAllAvailablePlayers = async () => {
      try {
        console.log('🔍 Loading all available players...');

        // Try to load from database first
        try {
          const { supabaseAdmin } = await import(
            '@/integrations/supabase/adminClient'
          );
          const { data, error } = await supabaseAdmin
            .from('players')
            .select(
              'id, name, email, rating, state, status, phone, city, country, gamesPlayed'
            )
            .eq('status', 'approved');

          if (!error && data && data.length > 0) {
            console.log('✅ Found players from database:', data.length);
            setAllAvailablePlayers(data);
            return;
          }
        } catch (dbError) {
          console.log('Database not available, using mock player data');
        }

        // Fallback to mock data
        const mockPlayers: Player[] = [
          {
            id: 'player-1',
            name: 'Adebayo Adebisi',
            email: 'adebayo@example.com',
            rating: 1650,
            state: 'Lagos',
            status: 'approved',
            phone: '+234-xxx-xxxx',
            city: 'Lagos',
            country: 'Nigeria',
            gamesPlayed: 25,
          },
          {
            id: 'player-2',
            name: 'Fatima Mohammed',
            email: 'fatima@example.com',
            rating: 1420,
            state: 'Kano',
            status: 'approved',
            phone: '+234-xxx-xxxx',
            city: 'Kano',
            country: 'Nigeria',
            gamesPlayed: 18,
          },
          {
            id: 'player-3',
            name: 'Chinedu Okafor',
            email: 'chinedu@example.com',
            rating: 1780,
            state: 'Anambra',
            status: 'approved',
            phone: '+234-xxx-xxxx',
            city: 'Awka',
            country: 'Nigeria',
            gamesPlayed: 32,
          },
          {
            id: 'player-4',
            name: 'Aisha Bello',
            email: 'aisha@example.com',
            rating: 1520,
            state: 'Abuja',
            status: 'approved',
            phone: '+234-xxx-xxxx',
            city: 'Abuja',
            country: 'Nigeria',
            gamesPlayed: 22,
          },
          {
            id: 'player-5',
            name: 'Emeka Nwankwo',
            email: 'emeka@example.com',
            rating: 1890,
            state: 'Rivers',
            status: 'approved',
            phone: '+234-xxx-xxxx',
            city: 'Port Harcourt',
            country: 'Nigeria',
            gamesPlayed: 45,
          },
        ];

        console.log('✅ Mock players loaded:', mockPlayers.length);
        setAllAvailablePlayers(mockPlayers);
      } catch (error) {
        console.error('❌ Error loading available players:', error);
      }
    };

    loadTournament();
  }, [id, toast]);

  const isOrganizer =
    currentUser && tournament && currentUser.id === tournament.organizer_id;
  const canStartTournament =
    tournament?.status === 'approved' &&
    selectedPlayers.length >= 2 &&
    !tournament.registration_open;

  const handleAddPlayer = async (player: Player) => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      const updatedTournament = await addPlayerToTournament(
        tournament.id,
        player
      );
      if (updatedTournament) {
        setTournament(updatedTournament);
        setSelectedPlayers(updatedTournament.players || []);
      }
    } catch (error) {
      console.error('Error adding player:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemovePlayer = async (player: Player) => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      const updatedTournament = await removePlayerFromTournament(
        tournament.id,
        player
      );
      if (updatedTournament) {
        setTournament(updatedTournament);
        setSelectedPlayers(updatedTournament.players || []);
      }
    } catch (error) {
      console.error('Error removing player:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePairings = async () => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      const roundData = {
        roundNumber: tournament.current_round || 1,
        matches: [],
      };

      const pairings = await generatePairings(tournament.id, roundData);
      if (pairings) {
        const updatedTournament = {
          ...tournament,
          pairings: [...(tournament.pairings || []), ...pairings],
        };
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error('Error generating pairings:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRegistration = async () => {
    if (!tournament) return;

    try {
      setIsProcessing(true);

      // Update tournament state immediately for better UX
      const newRegistrationStatus = !tournament.registration_open;
      setTournament((prev) =>
        prev ? { ...prev, registration_open: newRegistrationStatus } : null
      );

      console.log(
        `🔄 Toggling registration: ${tournament.registration_open} → ${newRegistrationStatus}`
      );

      // Update in database
      const { updateTournament } = await import(
        '@/services/tournament/tournamentService'
      );
      const updatedTournament = await updateTournament(tournament.id, {
        registration_open: newRegistrationStatus,
      });

      if (updatedTournament) {
        console.log('✅ Registration status updated successfully');
        setTournament(updatedTournament);

        toast({
          title: newRegistrationStatus
            ? 'Registration Opened'
            : 'Registration Closed',
          description: newRegistrationStatus
            ? 'Player registration is now open.'
            : 'Player registration has been closed.',
        });
      } else {
        // Revert state if update failed
        setTournament((prev) =>
          prev
            ? { ...prev, registration_open: tournament.registration_open }
            : null
        );
        throw new Error('Failed to update registration status');
      }
    } catch (error) {
      console.error('❌ Error toggling registration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update registration status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTournament = async () => {
    if (!tournament || tournament.status !== 'approved') return;

    try {
      setIsProcessing(true);
      const updatedTournament = await startTournament(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
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
      const updatedTournament = await completeTournament(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error('Error completing tournament:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextRound = async () => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      const updatedTournament = await nextRound(tournament.id);
      if (updatedTournament) {
        setTournament(updatedTournament);
      }
    } catch (error) {
      console.error('Error advancing to next round:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordResult = async (
    pairing: Pairing,
    result: '1-0' | '0-1' | '1/2-1/2'
  ) => {
    if (!tournament) return;

    try {
      setIsProcessing(true);
      const resultData: Result = {
        table: pairing.table,
        white: pairing.white,
        black: pairing.black,
        result,
      };

      await recordResult(tournament.id, resultData);
      // Refresh tournament data after recording result
      const updatedTournament = { ...tournament };
      setTournament(updatedTournament);
    } catch (error) {
      console.error('Error recording result:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="container pt-24 pb-20 px-4 max-w-7xl mx-auto">
          <div className="text-center">Loading tournament...</div>
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

  const currentRoundPairings = Array.isArray(tournament.pairings)
    ? tournament.pairings.filter((p) => p.round === tournament.current_round)
    : [];

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

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="players">
              Players ({selectedPlayers.length})
            </TabsTrigger>
            <TabsTrigger value="rounds">Rounds</TabsTrigger>
            <TabsTrigger value="pairings">Current Round</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <PlayersTab
              tournamentId={tournament.id}
              tournamentStatus={tournament.status}
              registeredPlayers={selectedPlayers}
              allPlayers={allAvailablePlayers}
              playerIds={selectedPlayers.map((p) => p.id)}
              onCreatePlayer={() => {}}
              onAddPlayers={(players) => {
                console.log('Adding players to tournament:', players.length);
                players.forEach((player) => {
                  // Add player to selectedPlayers state
                  setSelectedPlayers((prev) => [...prev, player]);
                  // Update tournament participants count
                  setTournament((prev) =>
                    prev
                      ? {
                          ...prev,
                          participants: prev.participants + 1,
                          players: [...(prev.players || []), player],
                        }
                      : null
                  );
                });
              }}
              onRemovePlayer={(playerId) => {
                console.log('Removing player from tournament:', playerId);
                // Remove from selectedPlayers state
                setSelectedPlayers((prev) =>
                  prev.filter((p) => p.id !== playerId)
                );
                // Update tournament participants count
                setTournament((prev) =>
                  prev
                    ? {
                        ...prev,
                        participants: Math.max(0, prev.participants - 1),
                        players: (prev.players || []).filter(
                          (p) => p.id !== playerId
                        ),
                      }
                    : null
                );
              }}
              isProcessing={isProcessing}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </TabsContent>

          <TabsContent value="rounds">
            <RoundController
              tournament={tournament}
              onGeneratePairings={handleGeneratePairings}
              onNextRound={handleNextRound}
              isOrganizer={isOrganizer}
              isProcessing={isProcessing}
            />
          </TabsContent>

          <TabsContent value="pairings">
            <Card>
              <CardHeader>
                <CardTitle>Round {tournament.current_round} Pairings</CardTitle>
              </CardHeader>
              <CardContent>
                {currentRoundPairings.length > 0 ? (
                  <ResultRecorder
                    pairings={currentRoundPairings}
                    onRecordResult={handleRecordResult}
                    isOrganizer={isOrganizer}
                  />
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No pairings generated for this round yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="standings">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Standings</CardTitle>
              </CardHeader>
              <CardContent>
                <StandingsTable
                  players={selectedPlayers}
                  results={tournament.results || []}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
