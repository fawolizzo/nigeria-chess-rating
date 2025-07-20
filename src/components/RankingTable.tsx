import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Player } from '@/lib/mockData';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PlayerLinkWrapperProps {
  playerId: string;
  children: React.ReactNode;
}

interface RankingTableProps {
  players: Player[];
  itemsPerPage?: number;
  showRankings?: boolean;
}

export const PlayerLinkWrapper: React.FC<PlayerLinkWrapperProps> = ({
  playerId,
  children,
}) => {
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
  itemsPerPage = 50,
  showRankings = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Sort players by classical rating (descending order) - highest rating first
  const sortedPlayers = [...players].sort((a, b) => {
    const ratingA = a.rating || 800;
    const ratingB = b.rating || 800;
    return ratingB - ratingA; // Descending order for rankings
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedPlayers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayPlayers = sortedPlayers.slice(startIndex, endIndex);

  console.log(
    '🏆 RankingTable: Displaying players sorted by rating:',
    displayPlayers.map((p) => `${p.name}: ${p.rating}`)
  );

  if (sortedPlayers.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No players found</p>
      </div>
    );
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="space-y-4">
      {/* Pagination Info */}
      <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <div>
          Showing {startIndex + 1} to {Math.min(endIndex, sortedPlayers.length)}{' '}
          of {sortedPlayers.length} players
        </div>
        <div>
          Page {currentPage} of {totalPages}
        </div>
      </div>

      {/* Table */}
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
              <tr
                key={player.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                {showRankings && (
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {startIndex + index + 1}
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
                  <span
                    className={`${
                      player.ratingStatus === 'provisional'
                        ? 'text-orange-600 dark:text-orange-400'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
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
                  {player.state || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                <React.Fragment key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page as number)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            Jump to page:{' '}
            <select
              value={currentPage}
              onChange={(e) => handlePageChange(Number(e.target.value))}
              className="ml-1 border border-gray-300 rounded px-2 py-1 text-sm"
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <option key={page} value={page}>
                    {page}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankingTable;
