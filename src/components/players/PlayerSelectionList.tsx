import { Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Player } from '@/lib/mockData';

interface PlayerSelectionListProps {
  filteredPlayers: Player[];
  selectedPlayers: Player[];
  onSelectPlayer: (player: Player) => void;
}

export const PlayerSelectionList = ({
  filteredPlayers,
  selectedPlayers,
  onSelectPlayer,
}: PlayerSelectionListProps) => {
  return (
    <ScrollArea className="h-72 rounded-md border">
      {Array.isArray(filteredPlayers) && filteredPlayers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full py-8">
          <div className="text-gray-500 dark:text-gray-400 text-center">
            No players found
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-200 dark:divide-gray-800">
          {Array.isArray(filteredPlayers)
            ? filteredPlayers.map((player) => {
                const isSelected = Array.isArray(selectedPlayers)
                  ? selectedPlayers.some((p) => p.id === player.id)
                  : false;
                const isTitleVerified = player.titleVerified && player.title;

                return (
                  <div
                    key={player.id}
                    className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => onSelectPlayer(player)}
                  >
                    <div className="flex items-center flex-1">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onSelectPlayer(player)}
                        className="mr-3"
                        id={`player-${player.id}`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 dark:text-white flex items-center">
                          {player.title && (
                            <span className="text-gold-dark dark:text-gold-light mr-2">
                              {player.title}
                            </span>
                          )}
                          {player.name}
                          {isTitleVerified && (
                            <span className="ml-1.5 inline-flex items-center justify-center bg-blue-500 rounded-full w-5 h-5">
                              <Check
                                className="h-3 w-3 text-white"
                                strokeWidth={3}
                              />
                            </span>
                          )}
                          {player.status === 'pending' && (
                            <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-x-2">
                          <span>Rating: {player.rating}</span>
                          {player.state && <span>• {player.state}</span>}
                          <span className="text-xs text-gray-400">
                            ID: {player.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-5 w-5 text-blue-600 dark:text-blue-400 ml-2" />
                    )}
                  </div>
                );
              })
            : null}
        </div>
      )}
    </ScrollArea>
  );
};

export default PlayerSelectionList;
