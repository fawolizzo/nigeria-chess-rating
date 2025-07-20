import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TournamentResult } from '@/lib/mockData';
import {
  Trophy,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface PlayerPerformanceProps {
  tournamentResults: TournamentResult[];
}

const PlayerPerformance: React.FC<PlayerPerformanceProps> = ({
  tournamentResults,
}) => {
  // Calculate performance statistics
  const totalTournaments = tournamentResults.length;
  const totalRatingChange = tournamentResults.reduce(
    (sum, result) => sum + result.ratingChange,
    0
  );
  const averageRatingChange =
    totalTournaments > 0 ? totalRatingChange / totalTournaments : 0;

  const wins = Array.isArray(tournamentResults)
    ? tournamentResults.filter((result) => result.result === '1-0').length
    : 0;
  const draws = Array.isArray(tournamentResults)
    ? tournamentResults.filter((result) => result.result === '1/2-1/2').length
    : 0;
  const losses = Array.isArray(tournamentResults)
    ? tournamentResults.filter((result) => result.result === '0-1').length
    : 0;

  const winPercentage =
    totalTournaments > 0 ? ((wins + draws * 0.5) / totalTournaments) * 100 : 0;

  // Group tournaments by format
  const formatStats = tournamentResults.reduce(
    (acc, result) => {
      if (!acc[result.format]) {
        acc[result.format] = { count: 0, ratingChange: 0 };
      }
      acc[result.format].count++;
      acc[result.format].ratingChange += result.ratingChange;
      return acc;
    },
    {} as Record<string, { count: number; ratingChange: number }>
  );

  const formatTournamentResults = (results: TournamentResult[]) => {
    return results.map((result, index) => {
      // Mock tournament data for display
      const mockTournament = {
        id: result.tournamentId,
        name: result.tournamentName,
        start_date: result.date,
        end_date: result.date,
        location: result.location || 'Lagos, Nigeria',
      };

      return (
        <div
          key={index}
          className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 mb-4"
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {mockTournament.name}
            </h4>
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-sm ${
                result.ratingChange > 0
                  ? 'bg-green-100 text-green-700'
                  : result.ratingChange < 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
              }`}
            >
              {result.ratingChange > 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : result.ratingChange < 0 ? (
                <TrendingDown className="h-3 w-3" />
              ) : null}
              {result.ratingChange > 0 ? '+' : ''}
              {result.ratingChange}
            </div>
          </div>

          <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <Calendar className="h-3 w-3 mr-2" />
              <span>
                {mockTournament.start_date} - {mockTournament.end_date}
              </span>
            </div>
            <div className="flex items-center">
              <MapPin className="h-3 w-3 mr-2" />
              <span>{mockTournament.location}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>vs {result.opponent}</span>
              <span className="font-medium">{result.result}</span>
            </div>
            {result.position && (
              <div className="flex items-center">
                <Trophy className="h-3 w-3 mr-2" />
                <span>Position: {result.position}</span>
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Performance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tournaments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTournaments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {winPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {wins}W - {draws}D - {losses}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Rating Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                averageRatingChange > 0
                  ? 'text-green-600'
                  : averageRatingChange < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {averageRatingChange > 0 ? '+' : ''}
              {averageRatingChange.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Rating Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                totalRatingChange > 0
                  ? 'text-green-600'
                  : totalRatingChange < 0
                    ? 'text-red-600'
                    : 'text-gray-600'
              }`}
            >
              {totalRatingChange > 0 ? '+' : ''}
              {totalRatingChange}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Format Statistics */}
      {Object.keys(formatStats).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance by Format</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(formatStats).map(([format, stats]) => (
                <div
                  key={format}
                  className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <h4 className="font-medium capitalize">{format}</h4>
                  <p className="text-sm text-muted-foreground">
                    {stats.count} tournaments
                  </p>
                  <p
                    className={`font-bold ${
                      stats.ratingChange > 0
                        ? 'text-green-600'
                        : stats.ratingChange < 0
                          ? 'text-red-600'
                          : 'text-gray-600'
                    }`}
                  >
                    {stats.ratingChange > 0 ? '+' : ''}
                    {stats.ratingChange} total
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Tournament Results */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament History</CardTitle>
        </CardHeader>
        <CardContent>
          {tournamentResults.length > 0 ? (
            <div className="space-y-4">
              {formatTournamentResults(tournamentResults.slice(0, 10))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No tournament results available yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerPerformance;
