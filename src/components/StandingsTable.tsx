
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Award } from "lucide-react";
import { Player } from "@/lib/mockData";

interface PlayerWithScore extends Player {
  score: number;
  opponents: string[];
}

interface StandingsTableProps {
  standings: PlayerWithScore[];
  players: Player[];
}

const StandingsTable = ({ standings, players }: StandingsTableProps) => {
  const calculateBuchholz = (player: PlayerWithScore) => {
    // Buchholz is the sum of the scores of all the player's opponents
    let buchholz = 0;
    player.opponents.forEach(opponentId => {
      const opponent = standings.find(p => p.id === opponentId);
      if (opponent) {
        buchholz += opponent.score;
      }
    });
    return buchholz;
  };

  // Sort standings by score, then by buchholz
  const sortedStandings = [...standings].sort((a, b) => {
    if (b.score === a.score) {
      // If scores are tied, sort by buchholz
      return calculateBuchholz(b) - calculateBuchholz(a);
    }
    return b.score - a.score;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tournament Standings</CardTitle>
      </CardHeader>
      <CardContent>
        {sortedStandings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Rank</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Player</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Rating</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Score</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Buchholz</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sortedStandings.map((player, index) => (
                  <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium">
                          {index === 0 ? (
                            <Trophy className="h-4 w-4 text-yellow-500 inline mr-1" />
                          ) : index === 1 ? (
                            <Award className="h-4 w-4 text-gray-400 inline mr-1" />
                          ) : index === 2 ? (
                            <Award className="h-4 w-4 text-amber-600 inline mr-1" />
                          ) : null}
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {player.title && (
                            <span className="text-gold-dark dark:text-gold-light mr-1">
                              {player.title}
                            </span>
                          )}
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                      {player.rating}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-semibold text-gray-900 dark:text-white">
                      {player.score}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-gray-600 dark:text-gray-300">
                      {calculateBuchholz(player)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <Trophy className="h-10 w-10 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No standings yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Standings will be available after games have been played.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StandingsTable;
