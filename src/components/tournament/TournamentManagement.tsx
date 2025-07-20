import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Play,
  Trophy,
  Settings,
  UserPlus,
  FileText,
  Clock,
  MapPin,
  Calendar,
  Trash2,
} from 'lucide-react';
import { Tournament } from '@/types/tournamentTypes';
import { Player } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import AddPlayersDialog from './AddPlayersDialog';

interface TournamentManagementProps {
  tournament?: Tournament;
}

const TournamentManagement: React.FC<TournamentManagementProps> = ({
  tournament,
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [tournamentData, setTournamentData] = useState<Tournament | null>(
    tournament || null
  );
  const [registeredPlayers, setRegisteredPlayers] = useState<Player[]>([]);
  const [currentRound, setCurrentRound] = useState(1);

  // Mock tournament data for demonstration
  useEffect(() => {
    if (!tournamentData && id) {
      // In real implementation, fetch tournament data from API
      const mockTournament: Tournament = {
        id: id,
        name: 'Lagos State Championship 2025',
        description: 'Annual chess championship for Lagos State',
        location: 'National Theatre Lagos',
        city: 'Lagos',
        state: 'Lagos',
        start_date: '2025-02-15',
        end_date: '2025-02-17',
        time_control: '90+30',
        rounds: 7,
        status: 'approved',
        organizer_id: 'org-1',
        registration_open: true,
        participants: 0,
        current_round: 1,
        players: [],
        pairings: [],
        results: [],
      };
      setTournamentData(mockTournament);
    }
  }, [id, tournamentData]);

  const handleStartTournament = () => {
    if (registeredPlayers.length < 2) {
      toast({
        title: 'Cannot Start Tournament',
        description:
          'At least 2 players must be registered to start the tournament.',
        variant: 'destructive',
      });
      return;
    }

    setTournamentData((prev) => (prev ? { ...prev, status: 'ongoing' } : null));
    toast({
      title: 'Tournament Started',
      description:
        'The tournament has been started. Round 1 pairings are being generated.',
    });
  };

  const handleCompleteTournament = () => {
    setTournamentData((prev) =>
      prev ? { ...prev, status: 'completed' } : null
    );
    toast({
      title: 'Tournament Completed',
      description:
        'Tournament has been marked as completed. It will be sent to Rating Officer for processing.',
    });
  };

  const handlePlayersAdded = (newPlayers: Player[]) => {
    setRegisteredPlayers((prev) => [...prev, ...newPlayers]);
    setTournamentData((prev) =>
      prev
        ? {
            ...prev,
            participants: prev.participants + newPlayers.length,
          }
        : null
    );
  };

  const handleRemovePlayer = (playerId: string) => {
    setRegisteredPlayers((prev) => prev.filter((p) => p.id !== playerId));
    setTournamentData((prev) =>
      prev
        ? {
            ...prev,
            participants: Math.max(0, prev.participants - 1),
          }
        : null
    );

    toast({
      title: 'Player Removed',
      description: 'Player has been removed from the tournament.',
    });
  };

  const getRatingDisplay = (player: Player) => {
    if (player.rating && player.rating > 0) {
      return player.rating;
    }
    return 'Unrated';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'processed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Ready to Start';
      case 'ongoing':
        return 'In Progress';
      case 'completed':
        return 'Awaiting Rating';
      case 'processed':
        return 'Rated';
      default:
        return status;
    }
  };

  if (!tournamentData) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Tournament Not Found
          </h2>
          <Button onClick={() => navigate('/organizer-dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Tournament Header */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {tournamentData.name}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(
                  tournamentData.start_date
                ).toLocaleDateString()} -{' '}
                {new Date(tournamentData.end_date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {tournamentData.location}, {tournamentData.city},{' '}
                {tournamentData.state}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {tournamentData.time_control}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getStatusColor(tournamentData.status)}>
              {getStatusText(tournamentData.status)}
            </Badge>
            {tournamentData.status === 'approved' && (
              <Button
                onClick={handleStartTournament}
                className="bg-nigeria-green hover:bg-nigeria-green-dark"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Tournament
              </Button>
            )}
            {tournamentData.status === 'ongoing' && (
              <Button
                onClick={handleCompleteTournament}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Complete Tournament
              </Button>
            )}
          </div>
        </div>

        {tournamentData.description && (
          <p className="text-gray-600 dark:text-gray-400">
            {tournamentData.description}
          </p>
        )}
      </div>

      {/* Tournament Management Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="pairings">Pairings</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="standings">Standings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Registered Players
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {registeredPlayers.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {tournamentData.registration_open
                    ? 'Registration open'
                    : 'Registration closed'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Round
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{currentRound}</div>
                <p className="text-xs text-muted-foreground">
                  of {tournamentData.rounds} rounds
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tournament Format
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Swiss</div>
                <p className="text-xs text-muted-foreground">
                  {tournamentData.rounds} rounds
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tournament Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Time Control
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tournamentData.time_control}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Rounds
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tournamentData.rounds}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Location
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {tournamentData.location}, {tournamentData.city},{' '}
                    {tournamentData.state}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Dates
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {new Date(tournamentData.start_date).toLocaleDateString()} -{' '}
                    {new Date(tournamentData.end_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  Registered Players ({registeredPlayers.length})
                </CardTitle>
                <AddPlayersDialog
                  onPlayersAdded={handlePlayersAdded}
                  existingPlayerIds={registeredPlayers.map((p) => p.id)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {registeredPlayers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No Players Registered
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Start by adding players to your tournament.
                  </p>
                  <AddPlayersDialog
                    onPlayersAdded={handlePlayersAdded}
                    existingPlayerIds={registeredPlayers.map((p) => p.id)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {registeredPlayers.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-nigeria-green text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {player.name}
                            </h4>
                            {player.title && (
                              <Badge variant="secondary" className="text-xs">
                                {player.title}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <span>Rating: {getRatingDisplay(player)}</span>
                            {player.state && <span>State: {player.state}</span>}
                            {player.club && <span>Club: {player.club}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {getRatingDisplay(player)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {player.gamesPlayed || 0} games
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pairings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Round {currentRound} Pairings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Pairings Generated
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Pairings will be generated when the tournament starts.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Match Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Results Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Results will appear here as matches are completed.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="standings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tournament Standings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Standings Available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Standings will be calculated after the first round.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TournamentManagement;
