import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Player } from '@/lib/mockData';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SelectedPlayersListProps {
  selectedPlayers: Player[];
  onRemovePlayer: (player: Player) => void;
}

export const SelectedPlayersList = ({
  selectedPlayers,
  onRemovePlayer,
}: SelectedPlayersListProps) => {
  if (selectedPlayers.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="text-sm font-medium mb-2">
        Selected Players ({selectedPlayers.length})
      </div>
      {/* Add ScrollArea for selected players with fixed height to prevent pushing buttons off-screen */}
      <ScrollArea
        className={`${selectedPlayers.length > 5 ? 'h-32' : ''} max-h-32`}
      >
        <div className="flex flex-wrap gap-2">
          {selectedPlayers.map((player) => (
            <Badge
              key={player.id}
              variant="secondary"
              className={`flex items-center gap-1 py-1 ${
                player.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                  : ''
              }`}
            >
              {player.title && `${player.title} `}
              {player.name}
              {player.status === 'pending' && (
                <span className="text-xs ml-1">(Pending)</span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemovePlayer(player);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SelectedPlayersList;
