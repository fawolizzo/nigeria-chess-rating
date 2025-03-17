
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAllPlayers, Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";

import PlayerSearchInput from "@/components/players/PlayerSearchInput";
import SelectedPlayersList from "@/components/players/SelectedPlayersList";
import PlayerSelectionList from "@/components/players/PlayerSelectionList";

interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  excludeIds?: string[];
  hideDialog?: boolean; // Add this prop to support hiding the dialog
  includePendingPlayers?: boolean; // Add this prop to allow showing pending players
}

export const MultiSelectPlayers = ({ 
  isOpen, 
  onOpenChange, 
  onPlayersSelected,
  excludeIds = [],
  hideDialog = false, // Default to showing the dialog
  includePendingPlayers = false // Default to not showing pending players
}: MultiSelectPlayersProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);

  // Fetch approved and pending players for display
  useEffect(() => {
    const fetchPlayers = () => {
      // Force refresh player list every time the dialog opens to catch newly imported players
      const allPlayers = getAllPlayers();
      
      // Get players with any status but exclude those already in the tournament
      const availablePlayers = allPlayers.filter(player => {
        const isExcluded = excludeIds.includes(player.id);
        // Include or exclude pending players based on the includePendingPlayers prop
        const statusOk = includePendingPlayers ? true : player.status !== 'pending';
        return !isExcluded && statusOk;
      });
      
      console.log("Available players for selection:", availablePlayers);
      
      if (availablePlayers.length === 0) {
        if (allPlayers.length === 0) {
          toast({
            title: "No players available",
            description: "There are no players in the system yet.",
          });
        } else {
          toast({
            title: "No available players",
            description: "All players are already in this tournament.",
            variant: "destructive"
          });
        }
      }
      
      setPlayers(availablePlayers);
      setFilteredPlayers(availablePlayers);
    };
    
    if (isOpen) {
      fetchPlayers();
    }
  }, [excludeIds, isOpen, toast, includePendingPlayers]);

  // Reset selections when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlayers([]);
      setSearchQuery("");
    }
  }, [isOpen]);

  // Filter players based on search query
  useEffect(() => {
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
    setSelectedPlayers(prev => {
      if (prev.some(p => p.id === player.id)) {
        // Remove player if already selected
        return prev.filter(p => p.id !== player.id);
      } else {
        // Add player to selection
        return [...prev, player];
      }
    });
  };

  const handleConfirmSelection = () => {
    onPlayersSelected(selectedPlayers);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };
  
  // If hideDialog is true, render without the Dialog wrapper
  if (hideDialog) {
    return (
      <div className="space-y-4">
        <PlayerSearchInput 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        
        <SelectedPlayersList 
          selectedPlayers={selectedPlayers}
          onRemovePlayer={handleSelectPlayer}
        />
        
        <PlayerSelectionList 
          filteredPlayers={filteredPlayers}
          selectedPlayers={selectedPlayers}
          onSelectPlayer={handleSelectPlayer}
        />
        
        {players.length === 0 && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">
              No available players found. Please import players or create new ones.
            </p>
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSelection} 
            disabled={selectedPlayers.length === 0}
          >
            Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    );
  }

  // Default to using Dialog wrapper
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Select Players</DialogTitle>
          <DialogDescription>
            Select one or more players to add to your tournament.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <PlayerSearchInput 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
          
          <SelectedPlayersList 
            selectedPlayers={selectedPlayers}
            onRemovePlayer={handleSelectPlayer}
          />
          
          <PlayerSelectionList 
            filteredPlayers={filteredPlayers}
            selectedPlayers={selectedPlayers}
            onSelectPlayer={handleSelectPlayer}
          />
          
          {players.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No available players found. Please import players or create new ones.
              </p>
            </div>
          )}
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
