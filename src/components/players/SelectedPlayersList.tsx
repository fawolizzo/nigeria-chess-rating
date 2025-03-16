
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Player } from "@/lib/mockData";

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
    <div>
      <div className="text-sm font-medium mb-2">Selected Players ({selectedPlayers.length})</div>
      <div className="flex flex-wrap gap-2">
        {selectedPlayers.map(player => (
          <Badge 
            key={player.id} 
            variant="secondary"
            className="flex items-center gap-1 py-1"
          >
            {player.title && `${player.title} `}{player.name}
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
    </div>
  );
};

export default SelectedPlayersList;
