import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Player } from '@/lib/mockData';
import { getKFactor } from '@/lib/ratingCalculation';
import { TrendingDown, TrendingUp, Minus, AlertCircle } from 'lucide-react';

interface PlayerRatingsProps {
  player: Player;
}

const PlayerRatings: React.FC<PlayerRatingsProps> = ({ player }) => {
  // Get K-factor for classical rating
  const classicalKFactor = getKFactor(player.rating, player.gamesPlayed || 0);

  // Set default values for rapid and blitz if not available
  const rapidRating = player.rapidRating || 'Not rated';
  const blitzRating = player.blitzRating || 'Not rated';

  // Calculate recent rating change from history if available
  const calculateRecentChange = () => {
    if (player.ratingHistory && player.ratingHistory.length >= 2) {
      const sortedHistory = [...player.ratingHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      const latestRating = sortedHistory[0].rating;
      const previousRating = sortedHistory[1].rating;

      return latestRating - previousRating;
    }
    return 0;
  };

  const ratingChange = calculateRecentChange();

  // Calculate rapid rating change if history available
  const calculateRecentRapidChange = () => {
    if (player.rapidRatingHistory && player.rapidRatingHistory.length >= 2) {
      const sortedHistory = [...player.rapidRatingHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return sortedHistory[0].rating - sortedHistory[1].rating;
    }
    return 0;
  };

  // Calculate blitz rating change if history available
  const calculateRecentBlitzChange = () => {
    if (player.blitzRatingHistory && player.blitzRatingHistory.length >= 2) {
      const sortedHistory = [...player.blitzRatingHistory].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return sortedHistory[0].rating - sortedHistory[1].rating;
    }
    return 0;
  };

  const rapidRatingChange = player.rapidRating
    ? calculateRecentRapidChange()
    : 0;
  const blitzRatingChange = player.blitzRating
    ? calculateRecentBlitzChange()
    : 0;

  // Determine the player's rating status text based on games played
  const getRatingStatusText = (gamesPlayed: number = 0) => {
    if (gamesPlayed >= 30) {
      return 'Established rating';
    } else {
      return `${30 - gamesPlayed} more games until established`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
            <div className="text-lg font-semibold">Classical</div>
            <div className="text-3xl font-bold mt-1 flex items-center">
              {player.rating}
              {ratingChange !== 0 && (
                <span
                  className={`ml-2 text-sm ${ratingChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {ratingChange > 0 ? (
                    <TrendingUp className="h-4 w-4 inline" />
                  ) : (
                    <TrendingDown className="h-4 w-4 inline" />
                  )}
                  {Math.abs(ratingChange)}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              K-factor: {classicalKFactor}
            </div>
            <div className="text-sm text-gray-500">
              {getRatingStatusText(player.gamesPlayed)}
            </div>
          </div>

          <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
            <div className="text-lg font-semibold">Rapid</div>
            <div className="text-3xl font-bold mt-1 flex items-center">
              {rapidRating}
              {typeof rapidRating === 'number' && rapidRatingChange !== 0 && (
                <span
                  className={`ml-2 text-sm ${rapidRatingChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {rapidRatingChange > 0 ? (
                    <TrendingUp className="h-4 w-4 inline" />
                  ) : (
                    <TrendingDown className="h-4 w-4 inline" />
                  )}
                  {Math.abs(rapidRatingChange)}
                </span>
              )}
            </div>
            {player.rapidRating && (
              <>
                <div className="text-sm text-gray-500 mt-1">
                  K-factor:{' '}
                  {getKFactor(player.rapidRating, player.rapidGamesPlayed || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  {getRatingStatusText(player.rapidGamesPlayed || 0)}
                </div>
              </>
            )}
          </div>

          <div className="p-4 border rounded-md bg-white dark:bg-gray-800">
            <div className="text-lg font-semibold">Blitz</div>
            <div className="text-3xl font-bold mt-1 flex items-center">
              {blitzRating}
              {typeof blitzRating === 'number' && blitzRatingChange !== 0 && (
                <span
                  className={`ml-2 text-sm ${blitzRatingChange > 0 ? 'text-green-500' : 'text-red-500'}`}
                >
                  {blitzRatingChange > 0 ? (
                    <TrendingUp className="h-4 w-4 inline" />
                  ) : (
                    <TrendingDown className="h-4 w-4 inline" />
                  )}
                  {Math.abs(blitzRatingChange)}
                </span>
              )}
            </div>
            {player.blitzRating && (
              <>
                <div className="text-sm text-gray-500 mt-1">
                  K-factor:{' '}
                  {getKFactor(player.blitzRating, player.blitzGamesPlayed || 0)}
                </div>
                <div className="text-sm text-gray-500">
                  {getRatingStatusText(player.blitzGamesPlayed || 0)}
                </div>
              </>
            )}
          </div>
        </div>

        {player.ratingHistory && player.ratingHistory.length > 0 ? (
          <div className="mt-6">
            <h3 className="text-md font-medium mb-2">Recent Rating Changes</h3>
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Rating
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Change
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {[...player.ratingHistory]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    )
                    .slice(0, 5)
                    .map((entry, i, arr) => {
                      const change =
                        i < arr.length - 1
                          ? entry.rating - arr[i + 1].rating
                          : 0;
                      return (
                        <tr
                          key={entry.date}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {entry.rating}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {i < arr.length - 1 ? (
                              <span
                                className={
                                  change > 0
                                    ? 'text-green-500'
                                    : change < 0
                                      ? 'text-red-500'
                                      : 'text-gray-500'
                                }
                              >
                                {change > 0 ? '+' : ''}
                                {change !== 0 ? (
                                  change
                                ) : (
                                  <Minus className="h-3 w-3 inline" />
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-500">
                                <Minus className="h-3 w-3 inline" />
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {entry.reason || 'Initial rating'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 border rounded-md flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
            <span className="text-sm text-gray-500">
              No rating history available
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerRatings;
