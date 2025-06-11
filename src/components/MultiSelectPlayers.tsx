
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users, X } from "lucide-react";
import { Player } from "@/lib/mockData";

interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  excludeIds?: string[];
  hideDialog?: boolean;
  includePendingPlayers?: boolean;
}

const MultiSelectPlayers: React.FC<MultiSelectPlayersProps> = ({
  isOpen,
  onOpenChange,
  onPlayersSelected,
  excludeIds = [],
  hideDialog = false,
  includePendingPlayers = false
}) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPlayers = () => {
      try {
        const storedPlayers = localStorage.getItem('players');
        if (storedPlayers) {
          const allPlayers: Player[] = JSON.parse(storedPlayers);
          const filteredPlayers = allPlayers.filter(player => {
            // Filter by status
            const statusMatch = includePendingPlayers ? 
              (player.status === "approved" || player.status === "pending") : 
              player.status === "approved";
            
            // Filter out excluded IDs
            const notExcluded = !excludeIds.includes(player.id);
            
            return statusMatch && notExcluded;
          });
          setPlayers(filteredPlayers);
        }
      } catch (error) {
        console.error('Error loading players:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      loadPlayers();
    }
  }, [isOpen, excludeIds, includePendingPlayers]);

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePlayerToggle = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.find(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };

  const handleConfirm = () => {
    onPlayersSelected(selectedPlayers);
    setSelectedPlayers([]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPlayers([]);
    onOpenChange(false);
  };

  if (hideDialog) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Players
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search players by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected Players */}
          {selectedPlayers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Selected Players ({selectedPlayers.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map(player => (
                  <Badge key={player.id} variant="secondary" className="flex items-center gap-1">
                    {player.name}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => handlePlayerToggle(player)} 
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Players List */}
          <ScrollArea className="h-64 border rounded-md p-4">
            {isLoading ? (
              <div className="text-center py-4">Loading players...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                {searchTerm ? "No players found matching your search" : "No players available"}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPlayers.map(player => {
                  const isSelected = selectedPlayers.find(p => p.id === player.id);
                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-md border cursor-pointer transition-colors ${
                        isSelected 
                          ? "bg-nigeria-green/10 border-nigeria-green" 
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => handlePlayerToggle(player)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-500">{player.email}</div>
                          <div className="text-xs text-gray-400">
                            {player.state}, {player.city}
                            {player.rating && ` • Rating: ${player.rating}`}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="text-nigeria-green">✓</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedPlayers.length === 0}
              className="bg-nigeria-green hover:bg-nigeria-green-dark"
            >
              Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectPlayers;
