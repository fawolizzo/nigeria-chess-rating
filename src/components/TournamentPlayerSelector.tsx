
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown } from "lucide-react";
import { Player, getAllPlayers } from "@/lib/mockData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check } from "lucide-react";

interface TournamentPlayerSelectorProps {
  tournamentId: string;
  existingPlayerIds: string[];
  onPlayersAdded: (players: Player[]) => void;
}

const TournamentPlayerSelector = ({ 
  tournamentId,
  existingPlayerIds,
  onPlayersAdded 
}: TournamentPlayerSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  useEffect(() => {
    // Get all players that are not already in the tournament
    const allPlayers = getAllPlayers().filter(player => 
      player.status === 'approved' && !existingPlayerIds.includes(player.id)
    );
    setAvailablePlayers(allPlayers);
  }, [existingPlayerIds]);

  const handleTogglePlayer = (playerId: string) => {
    setSelectedPlayerIds(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };

  const handleAddPlayers = () => {
    const playersToAdd = availablePlayers.filter(player => 
      selectedPlayerIds.includes(player.id)
    );
    
    if (playersToAdd.length > 0) {
      onPlayersAdded(playersToAdd);
      setSelectedPlayerIds([]);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className="text-sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Existing Player
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px]" align="start">
          {availablePlayers.length === 0 ? (
            <div className="py-2 px-4 text-sm text-gray-500 dark:text-gray-400">
              No available players
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              {availablePlayers.map(player => {
                const isSelected = selectedPlayerIds.includes(player.id);
                
                return (
                  <DropdownMenuCheckboxItem
                    key={player.id}
                    checked={isSelected}
                    onCheckedChange={() => handleTogglePlayer(player.id)}
                    className="flex justify-between items-center py-2"
                  >
                    <div>
                      <div className="font-medium">
                        {player.title && (
                          <span className="text-gold-dark dark:text-gold-light mr-1">
                            {player.title}
                          </span>
                        )}
                        {player.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        Rating: {player.rating}
                      </div>
                    </div>
                  </DropdownMenuCheckboxItem>
                );
              })}
            </ScrollArea>
          )}
          
          <DropdownMenuSeparator />
          
          <div className="p-2">
            <Button 
              size="sm" 
              className="w-full"
              disabled={selectedPlayerIds.length === 0}
              onClick={handleAddPlayers}
            >
              Add {selectedPlayerIds.length > 0 ? `(${selectedPlayerIds.length})` : ''} Player{selectedPlayerIds.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TournamentPlayerSelector;
