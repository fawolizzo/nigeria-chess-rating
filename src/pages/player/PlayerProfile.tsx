import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  User,
  Trophy,
  TrendingUp,
  Calendar,
  MapPin,
} from 'lucide-react';

interface PlayerWithStats extends Tables<'players'> {
  recent_tournaments?: {
    id: string;
    name: string;
    format: string;
    start_date: string;
    status: string;
  }[];
}

export default function PlayerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [player, setPlayer] = useState<PlayerWithStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch player details
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single();

      if (playerError) {
        setError('Player not found');
        return;
      }

      // Fetch recent tournaments
      const { data: tournaments, error: tournamentsError } = await supabase
        .from('tournament_players')
        .select(
          `
          tournaments (
            id,
            name,
            format,
            start_date,
            status
          )
        `
        )
        .eq('player_id', id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!tournamentsError && tournaments) {
        playerData.recent_tournaments = tournaments
          .map((tp) => tp.tournaments)
          .filter(Boolean) as any[];
      }

      setPlayer(playerData);
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, [id]);

  const getRatingBadge = (rating: number, games: number) => {
    const isProvisional = games < 30;

    if (rating >= 2400) {
      return (
        <Badge variant="default" className="bg-yellow-500">
          Master ({rating})
        </Badge>
      );
    } else if (rating >= 2100) {
      return (
        <Badge variant="default" className="bg-blue-500">
          Expert ({rating})
        </Badge>
      );
    } else if (rating >= 1800) {
      return <Badge variant="secondary">Class A ({rating})</Badge>;
    } else if (rating >= 1600) {
      return <Badge variant="outline">Class B ({rating})</Badge>;
    } else if (rating >= 1400) {
      return <Badge variant="outline">Class C ({rating})</Badge>;
    } else if (rating >= 1200) {
      return <Badge variant="outline">Class D ({rating})</Badge>;
    } else {
      return <Badge variant="outline">Beginner ({rating})</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Player not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Player Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{player.full_name}</h1>
            <div className="flex items-center gap-4 text-gray-600">
              {player.state && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {player.state}
                </div>
              )}
              {player.gender && (
                <div>{player.gender === 'M' ? 'Male' : 'Female'}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(player.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ratings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Current Ratings
              </CardTitle>
              <CardDescription>
                Player ratings across different time controls
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Classical</h3>
                  <div className="mb-2">
                    {getRatingBadge(
                      player.classical_rating,
                      player.classical_games
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {player.classical_games} games played
                    {player.classical_games < 30 && (
                      <span className="block text-xs text-orange-600">
                        Provisional ({30 - player.classical_games} games needed)
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Rapid</h3>
                  <div className="mb-2">
                    {getRatingBadge(player.rapid_rating, player.rapid_games)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {player.rapid_games} games played
                    {player.rapid_games < 30 && (
                      <span className="block text-xs text-orange-600">
                        Provisional ({30 - player.rapid_games} games needed)
                      </span>
                    )}
                  </p>
                </div>

                <div className="text-center">
                  <h3 className="font-medium text-gray-900 mb-2">Blitz</h3>
                  <div className="mb-2">
                    {getRatingBadge(player.blitz_rating, player.blitz_games)}
                  </div>
                  <p className="text-sm text-gray-600">
                    {player.blitz_games} games played
                    {player.blitz_games < 30 && (
                      <span className="block text-xs text-orange-600">
                        Provisional ({30 - player.blitz_games} games needed)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {player.has_rating_bonus && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <TrendingUp className="h-4 w-4" />
                    <span className="font-medium">Rating Bonus Applied</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    This player has received the +100 rating bonus for strong
                    performance.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Tournaments */}
          {player.recent_tournaments &&
            player.recent_tournaments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Tournaments
                  </CardTitle>
                  <CardDescription>
                    Latest tournament participations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {player.recent_tournaments.map((tournament) => (
                      <div
                        key={tournament.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{tournament.name}</div>
                          <div className="text-sm text-gray-600">
                            {new Date(
                              tournament.start_date
                            ).toLocaleDateString()}{' '}
                            • {tournament.format}
                          </div>
                        </div>
                        <Badge variant="outline">{tournament.status}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        {/* Player Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Player Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">Status</h4>
                  <div className="mt-1">{getStatusBadge(player.status)}</div>
                </div>

                {player.state && (
                  <div>
                    <h4 className="font-medium text-gray-900">State</h4>
                    <p className="text-gray-600">{player.state}</p>
                  </div>
                )}

                {player.gender && (
                  <div>
                    <h4 className="font-medium text-gray-900">Gender</h4>
                    <p className="text-gray-600">
                      {player.gender === 'M' ? 'Male' : 'Female'}
                    </p>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900">Member Since</h4>
                  <p className="text-gray-600">
                    {new Date(player.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900">Total Games</h4>
                  <p className="text-gray-600">
                    {player.classical_games +
                      player.rapid_games +
                      player.blitz_games}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
