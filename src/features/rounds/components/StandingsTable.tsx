import React, { useState, useEffect } from 'react';
import { getTournamentStandings } from '../api/generateNextRound';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Trophy, Medal, Award } from 'lucide-react';
import { QuickExportButton } from '@/features/pdf/components/PDFExportButtons';

interface Standing {
  rank: number;
  player_id: string;
  player_name: string;
  score: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  seed_rating: number;
}

interface Tournament {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  state: string;
  format: string;
  status: string;
}

interface StandingsTableProps {
  tournamentId: string;
  tournamentStatus: string;
  refreshTrigger?: number; // Used to trigger refresh from parent
  tournament?: Tournament;
}

export function StandingsTable({
  tournamentId,
  tournamentStatus,
  refreshTrigger,
  tournament,
}: StandingsTableProps) {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStandings = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getTournamentStandings(tournamentId);

      if (result.success) {
        setStandings(result.standings);
      } else {
        setError(result.error || 'Failed to load standings');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, [tournamentId, refreshTrigger]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-4 w-4 text-yellow-500" />;
      case 2:
        return <Medal className="h-4 w-4 text-gray-400" />;
      case 3:
        return <Award className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        2: 'bg-gray-100 text-gray-800 border-gray-300',
        3: 'bg-amber-100 text-amber-800 border-amber-300',
      };

      return (
        <Badge
          variant="outline"
          className={colors[rank as keyof typeof colors]}
        >
          <div className="flex items-center gap-1">
            {getRankIcon(rank)}#{rank}
          </div>
        </Badge>
      );
    }

    return <Badge variant="outline">#{rank}</Badge>;
  };

  const getScoreDisplay = (score: number) => {
    // Display score as whole number if it's a whole number, otherwise show decimal
    return score % 1 === 0 ? score.toString() : score.toFixed(1);
  };

  const getPerformanceStats = (standing: Standing) => {
    if (standing.games_played === 0) {
      return 'No games';
    }

    const percentage = ((standing.score / standing.games_played) * 100).toFixed(
      0
    );
    return `${percentage}% (${standing.wins}W-${standing.draws}D-${standing.losses}L)`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Tournament Standings
            <Badge variant="secondary">{standings.length} players</Badge>
          </div>
          {tournament && standings.length > 0 && (
            <QuickExportButton
              tournament={tournament}
              standings={standings}
              type="standings"
              size="sm"
            />
          )}
        </CardTitle>
        <CardDescription>
          Current standings based on completed rounds. Ties are broken by seed
          rating.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {standings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No standings available yet</p>
            <p className="text-sm">
              Standings will appear after the first round is completed
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Top 3 Podium (if tournament is completed) */}
            {tournamentStatus === 'completed' && standings.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
                {standings.slice(0, 3).map((standing, index) => (
                  <div key={standing.player_id} className="text-center">
                    <div className="flex justify-center mb-2">
                      {getRankIcon(standing.rank)}
                    </div>
                    <div className="font-medium text-sm">
                      {standing.player_name}
                    </div>
                    <div className="text-lg font-bold">
                      {getScoreDisplay(standing.score)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {standing.games_played} games
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Full Standings Table */}
            <div className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Games</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead className="text-center">Rating</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((standing) => (
                    <TableRow key={standing.player_id}>
                      <TableCell>{getRankBadge(standing.rank)}</TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {standing.player_name}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-bold text-lg">
                          {getScoreDisplay(standing.score)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-sm">{standing.games_played}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getPerformanceStats(standing)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{standing.seed_rating}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Tournament Status Info */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Scoring:</strong> Win = 1 point, Draw = 0.5 points, Loss
                = 0 points, Bye = 1 point
              </div>
              {tournamentStatus !== 'completed' && (
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Note:</strong> Standings update automatically after
                  each round is completed
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
