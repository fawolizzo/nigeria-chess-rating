
import React from "react";
import { Link } from "react-router-dom";
import { Player } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

interface PlayerLinkWrapperProps {
  playerId: string;
  children: React.ReactNode;
}

interface RankingTableProps {
  players: Player[];
  itemsPerPage?: number;
  showRankings?: boolean;
}

export const PlayerLinkWrapper: React.FC<PlayerLinkWrapperProps> = ({ playerId, children }) => {
  const { toast } = useToast();
  
  const handlePlayerClick = (e: React.MouseEvent) => {
    // Link component will handle navigation
  };
  
  return (
    <Link to={`/players/${playerId}`} onClick={handlePlayerClick}>
      {children}
    </Link>
  );
};

const RankingTable: React.FC<RankingTableProps> = ({ 
  players, 
  itemsPerPage = 10, 
  showRankings = true 
}) => {
  // Sort players by classical rating (descending order) - highest rating first
  const sortedPlayers = [...players].sort((a, b) => {
    const ratingA = a.rating || 800;
    const ratingB = b.rating || 800;
    return ratingB - ratingA; // Descending order for rankings
  });

  const displayPlayers = sortedPlayers.slice(0, itemsPerPage);

  console.log("🏆 RankingTable: Displaying players sorted by rating:", 
    displayPlayers.map(p => `${p.name}: ${p.rating}`));

  if (displayPlayers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No players found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            {showRankings && (
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rank
              </th>
            )}
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Classical Rating
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Games
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              State
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {displayPlayers.map((player, index) => (
            <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              {showRankings && (
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {index + 1}
                </td>
              )}
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <PlayerLinkWrapper playerId={player.id}>
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-nigeria-green flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3">
                      <span className="font-medium text-nigeria-green hover:text-nigeria-green-dark">
                        {player.title && (
                          <span className="text-gold-dark dark:text-gold-light mr-1">
                            {player.title}
                          </span>
                        )}
                        {player.name}
                      </span>
                      {player.titleVerified && (
                        <span className="ml-1 text-xs text-green-600">✓</span>
                      )}
                    </div>
                  </div>
                </PlayerLinkWrapper>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right font-medium">
                <span className={`${
                  player.ratingStatus === 'provisional' 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {player.rating || 800}
                </span>
                {player.ratingStatus === 'provisional' && (
                  <span className="ml-1 text-xs text-orange-500">P</span>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {player.gamesPlayed}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-400">
                {player.state || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RankingTable;
