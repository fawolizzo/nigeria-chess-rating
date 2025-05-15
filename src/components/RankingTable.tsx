import React from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Player } from "@/lib/mockData";

// Interface for the original PlayerLinkWrapper
interface PlayerLinkWrapperProps {
  playerId: string;
  children: React.ReactNode;
}

// New interface for the RankingTable component
interface RankingTableProps {
  players: Player[];
  itemsPerPage?: number;
}

// Keep the original PlayerLinkWrapper component
export const PlayerLinkWrapper: React.FC<PlayerLinkWrapperProps> = ({ playerId, children }) => {
  const { toast } = useToast();
  
  const handlePlayerClick = (e: React.MouseEvent) => {
    // We'll leave this empty for now as the Link component will handle the navigation
    // But we could add analytics or other logic here if needed
  };
  
  return (
    <Link to={`/players/${playerId}`} onClick={handlePlayerClick}>
      {children}
    </Link>
  );
};

// Create the RankingTable component
const RankingTable: React.FC<RankingTableProps> = ({ players, itemsPerPage = 10 }) => {
  // Implement the ranking table that uses PlayerLinkWrapper internally
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
          {players.slice(0, itemsPerPage).map((player, index) => (
            <tr key={player.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                {index + 1}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm">
                <PlayerLinkWrapper playerId={player.id}>
                  <span className="font-medium text-nigeria-green hover:text-nigeria-green-dark">
                    {player.title && <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>}
                    {player.name}
                  </span>
                </PlayerLinkWrapper>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white font-medium">
                {player.rating}
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
