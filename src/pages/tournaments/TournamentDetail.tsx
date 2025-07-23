import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { activateTournament } from '@/features/tournaments/api/createTournament';
import {
  generateRound1,
  getTournamentRounds,
} from '@/features/tournaments/api/generateRound1';
import { getTournamentPlayers } from '@/features/tournaments/api/addPlayerToTournament';
import {
  generateNextRound,
  completeTournament,
} from '@/features/rounds/api/generateNextRound';
import { completeRound } from '@/features/rounds/api/completeRound';
import { PlayerAdder } from '@/features/tournaments/components/PlayerAdder';
import { PairingsTable } from '@/features/tournaments/components/PairingsTable';
import { ResultEntryTable } from '@/features/results/components/ResultEntryTable';
import { StandingsTable } from '@/features/rounds/components/StandingsTable';
import { RatingJobStatus } from '@/features/ratings/components/RatingJobStatus';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Loader2,
  Calendar,
  MapPin,
  Users,
  Trophy,
  Play,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';

interface TournamentPlayer {
  id: string;
  player_id: string;
  seed_rating: number;
  score: number;
  withdrawn: boolean;
  players: {
    id: string;
    full_name: string;
    state: string | null;
    gender: string | null;
    classical_rating: number;
    rapid_rating: number;
    blitz_rating: number;
    status: string;
  };
}

interface Round {
  id: string;
  number: number;
  status: string;
  created_at: string;
  pairings: any[];
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [tournament, setTournament] = useState<Tables<'tournaments'> | null>(
    null
  );
  const [tournamentPlayers, setTournamentPlayers] = useState<
    TournamentPlayer[]
  >([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [standingsRefresh, setStandingsRefresh] = useState(0);

  const isOrganizer =
    user && profile && tournament && tournament.organizer_id === user.id;
  const canManage =
    isOrganizer && profile?.role === 'TO' && profile?.status === 'active';

  const fetchTournamentData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch tournament details
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('id', id)
        .single();

      if (tournamentError) {
        setError('Tournament not found');
        return;
      }

      setTournament(tournamentData);

      // Fetch tournament players
      const playersResult = await getTournamentPlayers(id);
      if (playersResult.success) {
        setTournamentPlayers(playersResult.players);
      }

      // Fetch rounds and pairings
      const roundsResult = await getTournamentRounds(id);
      if (roundsResult.success) {
        setRounds(roundsResult.rounds);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournamentData();
  }, [id]);

  const handleActivateTournament = async () => {
    if (!tournament || !user?.id) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await activateTournament(tournament.id, user.id);

      if (result.success) {
        setSuccess('Tournament activated successfully!');
        await fetchTournamentData();
      } else {
        setError(result.error || 'Failed to activate tournament');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateRound1 = async () => {
    if (!tournament || !user?.id) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await generateRound1({
        tournamentId: tournament.id,
        organizerId: user.id,
      });

      if (result.success) {
        setSuccess(
          `Round 1 generated with ${result.pairingsCount} pairings${result.hasBye ? ' (including 1 bye)' : ''}!`
        );
        await fetchTournamentData();
      } else {
        setError(result.error || 'Failed to generate Round 1');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteRound = async (roundId: string) => {
    if (!user?.id) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await completeRound({
        roundId,
        organizerId: user.id,
      });

      if (result.success) {
        setSuccess(`Round ${result.roundNumber} completed successfully!`);
        await fetchTournamentData();
        setStandingsRefresh((prev) => prev + 1);
      } else {
        setError(result.error || 'Failed to complete round');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateNextRound = async () => {
    if (!tournament || !user?.id) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await generateNextRound({
        tournamentId: tournament.id,
        organizerId: user.id,
      });

      if (result.success) {
        setSuccess(
          `Round ${result.roundNumber} generated with ${result.pairingsCount} pairings${result.hasBye ? ' (including 1 bye)' : ''}!`
        );
        await fetchTournamentData();
      } else {
        setError(result.error || 'Failed to generate next round');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteTournament = async () => {
    if (!tournament || !user?.id) return;

    setActionLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await completeTournament({
        tournamentId: tournament.id,
        organizerId: user.id,
      });

      if (result.success) {
        setSuccess('Tournament completed successfully!');
        await fetchTournamentData();
        setStandingsRefresh((prev) => prev + 1);
      } else {
        setError(result.error || 'Failed to complete tournament');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'ongoing':
        return <Badge variant="secondary">Ongoing</Badge>;
      case 'completed':
        return <Badge>Completed</Badge>;
      case 'ratings_processed':
        return <Badge>Rated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getFormatBadge = (format: string) => {
    const colors = {
      classical: 'bg-blue-100 text-blue-800',
      rapid: 'bg-green-100 text-green-800',
      blitz: 'bg-red-100 text-red-800',
    };

    return (
      <Badge
        variant="outline"
        className={colors[format as keyof typeof colors] || ''}
      >
        {format.charAt(0).toUpperCase() + format.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Tournament not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Tournament Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {tournament.city}, {tournament.state}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(tournament.start_date), 'MMM d')} -{' '}
                {format(new Date(tournament.end_date), 'MMM d, yyyy')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(tournament.status)}
            {getFormatBadge(tournament.format)}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {tournamentPlayers.length} players registered
          </div>
          <div className="flex items-center gap-1">
            <Trophy className="h-4 w-4" />
            {tournament.rounds_total} rounds
          </div>
        </div>
      </div>

      {/* Action Messages */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Management Actions (TO only) */}
      {canManage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tournament Management
            </CardTitle>
            <CardDescription>
              Manage your tournament settings and progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {tournament.status === 'draft' && (
                <Button
                  onClick={handleActivateTournament}
                  disabled={actionLoading || tournamentPlayers.length < 2}
                  variant="default"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Activate Tournament
                </Button>
              )}

              {tournament.status === 'active' && rounds.length === 0 && (
                <Button
                  onClick={handleGenerateRound1}
                  disabled={actionLoading}
                  variant="default"
                >
                  {actionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trophy className="mr-2 h-4 w-4" />
                  )}
                  Generate Round 1
                </Button>
              )}

              {tournament.status === 'ongoing' && rounds.length > 0 && (
                <>
                  {/* Check if current round can be completed */}
                  {rounds.some((r) => r.status === 'published') && (
                    <Button
                      onClick={() => {
                        const currentRound = rounds.find(
                          (r) => r.status === 'published'
                        );
                        if (currentRound) handleCompleteRound(currentRound.id);
                      }}
                      disabled={actionLoading}
                      variant="default"
                    >
                      {actionLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trophy className="mr-2 h-4 w-4" />
                      )}
                      Complete Current Round
                    </Button>
                  )}

                  {/* Check if next round can be generated */}
                  {rounds.every((r) => r.status === 'completed') &&
                    rounds.length < tournament.rounds_total && (
                      <Button
                        onClick={handleGenerateNextRound}
                        disabled={actionLoading}
                        variant="default"
                      >
                        {actionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trophy className="mr-2 h-4 w-4" />
                        )}
                        Generate Round {rounds.length + 1}
                      </Button>
                    )}

                  {/* Check if tournament can be completed */}
                  {rounds.length === tournament.rounds_total &&
                    rounds.every((r) => r.status === 'completed') && (
                      <Button
                        onClick={handleCompleteTournament}
                        disabled={actionLoading}
                        variant="default"
                      >
                        {actionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trophy className="mr-2 h-4 w-4" />
                        )}
                        Complete Tournament
                      </Button>
                    )}
                </>
              )}
            </div>

            {tournament.status === 'draft' && tournamentPlayers.length < 2 && (
              <p className="text-sm text-gray-600 mt-2">
                Add at least 2 players to activate the tournament
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tournament Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList
          className={`grid w-full ${canManage ? 'grid-cols-7' : 'grid-cols-4'}`}
        >
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="rounds">Rounds</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
          {canManage && <TabsTrigger value="results">Results</TabsTrigger>}
          {canManage && <TabsTrigger value="ratings">Ratings</TabsTrigger>}
          {canManage && <TabsTrigger value="manage">Manage</TabsTrigger>}
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Format</h4>
                    <p className="text-gray-600">
                      {tournament.format.charAt(0).toUpperCase() +
                        tournament.format.slice(1)}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Rounds</h4>
                    <p className="text-gray-600">
                      {tournament.rounds_total} rounds total
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Status</h4>
                    <div className="mt-1">
                      {getStatusBadge(tournament.status)}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Location</h4>
                    <p className="text-gray-600">
                      {tournament.city}, {tournament.state}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Dates</h4>
                    <p className="text-gray-600">
                      {format(new Date(tournament.start_date), 'MMMM d, yyyy')}{' '}
                      - {format(new Date(tournament.end_date), 'MMMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Players</h4>
                    <p className="text-gray-600">
                      {tournamentPlayers.length} registered
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Players
                <Badge variant="secondary">{tournamentPlayers.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tournamentPlayers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No players registered yet
                </p>
              ) : (
                <div className="space-y-2">
                  {tournamentPlayers.map((tp, index) => (
                    <div
                      key={tp.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">
                            {tp.players.full_name}
                          </div>
                          <div className="text-sm text-gray-600">
                            {tp.players.state && `${tp.players.state} • `}
                            Seed Rating: {tp.seed_rating}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {tp.players.status === 'pending' && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        <div className="text-right text-sm">
                          <div className="font-medium">Score: {tp.score}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="space-y-6">
          <PairingsTable
            rounds={rounds}
            tournamentStatus={tournament.status}
            tournament={tournament}
          />
        </TabsContent>

        <TabsContent value="standings" className="space-y-6">
          <StandingsTable
            tournamentId={tournament.id}
            tournamentStatus={tournament.status}
            refreshTrigger={standingsRefresh}
            tournament={tournament}
          />
        </TabsContent>

        {canManage && (
          <TabsContent value="results" className="space-y-6">
            {rounds.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-500">
                    No rounds available for result entry
                  </p>
                  <p className="text-sm text-gray-400">
                    Generate Round 1 to start entering results
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {rounds
                  .filter((round) => round.status === 'published')
                  .map((round) => (
                    <ResultEntryTable
                      key={round.id}
                      round={round}
                      onRoundComplete={() =>
                        setStandingsRefresh((prev) => prev + 1)
                      }
                    />
                  ))}

                {rounds.filter((round) => round.status === 'published')
                  .length === 0 && (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-gray-500">
                        No active rounds for result entry
                      </p>
                      <p className="text-sm text-gray-400">
                        {rounds.every((r) => r.status === 'completed')
                          ? 'All rounds completed'
                          : 'Generate the next round to enter results'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="ratings" className="space-y-6">
            <RatingJobStatus
              tournamentId={tournament.id}
              tournamentStatus={tournament.status}
              onRatingsProcessed={() => {
                fetchTournamentData();
                setStandingsRefresh((prev) => prev + 1);
              }}
            />
          </TabsContent>
        )}

        {canManage && (
          <TabsContent value="manage" className="space-y-6">
            {tournament.status === 'draft' && (
              <PlayerAdder
                tournamentId={tournament.id}
                onPlayerAdded={fetchTournamentData}
              />
            )}

            {tournament.status !== 'draft' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tournament Management</CardTitle>
                  <CardDescription>
                    Tournament is {tournament.status}. Player management is only
                    available for draft tournaments.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    The tournament has been activated and is now in progress.
                    Use the Rounds tab to view pairings and results.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
