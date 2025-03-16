
import { useState, useEffect } from "react";
import { Check, X, Search, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAllPlayers, Player } from "@/lib/mockData";

interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  excludeIds?: string[];
}

const MultiSelectPlayers = ({ 
  isOpen, 
  onOpenChange, 
  onPlayersSelected,
  excludeIds = []
}: MultiSelectPlayersProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  useEffect(() => {
    // Get all players
    const allPlayers = getAllPlayers().filter(player => 
      player.status === 'approved' && !excludeIds.includes(player.id)
    );
    
    setPlayers(allPlayers);
    setFilteredPlayers(allPlayers);
  }, [excludeIds]);

  useEffect(() => {
    // Filter players based on search query
    if (!searchQuery) {
      setFilteredPlayers(players);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    
    const filtered = players.filter(player => 
      player.name.toLowerCase().includes(lowerQuery) || 
      (player.title && player.title.toLowerCase().includes(lowerQuery)) ||
      (player.club && player.club.toLowerCase().includes(lowerQuery)) ||
      (player.state && player.state.toLowerCase().includes(lowerQuery)) ||
      player.rating.toString().includes(lowerQuery)
    );
    
    setFilteredPlayers(filtered);
  }, [searchQuery, players]);

  const handleSelectPlayer = (player: Player) => {
    if (selectedPlayers.some(p => p.id === player.id)) {
      // Remove player if already selected
      setSelectedPlayers(selectedPlayers.filter(p => p.id !== player.id));
    } else {
      // Add player to selection
      setSelectedPlayers([...selectedPlayers, player]);
    }
  };

  const handleConfirmSelection = () => {
    onPlayersSelected(selectedPlayers);
    onOpenChange(false);
    setSelectedPlayers([]);
    setSearchQuery("");
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedPlayers([]);
    setSearchQuery("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Players</DialogTitle>
          <DialogDescription>
            Search and select multiple players to add to your tournament.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search players by name, title, rating..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {selectedPlayers.length > 0 && (
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
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <ScrollArea className="h-72 rounded-md border">
            {filteredPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-8">
                <div className="text-gray-500 dark:text-gray-400 text-center">
                  No players found
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {filteredPlayers.map(player => {
                  const isSelected = selectedPlayers.some(p => p.id === player.id);
                  
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer ${
                        isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
                      }`}
                      onClick={() => handleSelectPlayer(player)}
                    >
                      <div className="flex items-center">
                        <div className="ml-3">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {player.title && (
                              <span className="text-gold-dark dark:text-gold-light mr-1">
                                {player.title}
                              </span>
                            )}
                            {player.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            Rating: {player.rating} • {player.state}, {player.country}
                          </div>
                        </div>
                      </div>
                      
                      {isSelected ? (
                        <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <PlusCircle className="h-5 w-5 text-gray-400 dark:text-gray-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSelection} 
            disabled={selectedPlayers.length === 0}
          >
            Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectPlayers;
