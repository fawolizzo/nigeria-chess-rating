
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Users } from "lucide-react";
import { Player } from "@/lib/mockData";

export interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  allPlayers: Player[];
  excludePlayerIds?: string[];
}

const MultiSelectPlayers: React.FC<MultiSelectPlayersProps> = ({
  isOpen,
  onOpenChange,
  onPlayersSelected,
  allPlayers,
  excludePlayerIds = [],
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  // Filter players based on search and exclusions
  const filteredPlayers = allPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchQuery.toLowerCase());
    const notExcluded = !excludePlayerIds.includes(player.id);
    return matchesSearch && notExcluded;
  });

  const handlePlayerToggle = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };

  const handleConfirm = async () => {
    await onPlayersSelected(selectedPlayers);
    setSelectedPlayers([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedPlayers([]);
    setSearchQuery("");
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Players for Tournament
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search players by name or email..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Selected count */}
          <div className="text-sm text-gray-600">
            {selectedPlayers.length} player(s) selected
          </div>

          {/* Player list */}
          <ScrollArea className="h-[300px] border rounded-md p-4">
            <div className="space-y-2">
              {filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.some(p => p.id === player.id);
                return (
                  <div
                    key={player.id}
                    className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                    onClick={() => handlePlayerToggle(player)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handlePlayerToggle(player)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-gray-500">
                        Rating: {player.rating || 800} • {player.state}, {player.city}
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredPlayers.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  No players found matching your search
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={selectedPlayers.length === 0}
            >
              Add {selectedPlayers.length} Player(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectPlayers;
