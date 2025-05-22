
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
import { Player } from "@/lib/mockData"; // Import only the type
import { useToast } from "@/components/ui/use-toast";
import { getAllPlayersFromSupabase } from "@/services/playerService";

import PlayerSearchInput from "@/components/players/PlayerSearchInput";
import SelectedPlayersList from "@/components/players/SelectedPlayersList";
import PlayerSelectionList from "@/components/players/PlayerSelectionList";

interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  excludeIds?: string[];
  hideDialog?: boolean; 
  includePendingPlayers?: boolean;
}

export const MultiSelectPlayers = ({ 
  isOpen, 
  onOpenChange, 
  onPlayersSelected,
  excludeIds = [],
  hideDialog = false,
  includePendingPlayers = true
}: MultiSelectPlayersProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all players, regardless of status
  useEffect(() => {
    const fetchPlayers = async () => {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        // Force refresh player list every time the dialog opens
        const allPlayers = await getAllPlayersFromSupabase({});
        console.log("All players in system:", allPlayers.length);
        
        // Filter players based on includePendingPlayers flag
        const statusFilteredPlayers = includePendingPlayers 
          ? allPlayers 
          : allPlayers.filter(player => player.status === 'approved');
        
        // Get players excluding those already in the tournament
        const availablePlayers = statusFilteredPlayers.filter(player => {
          return !excludeIds.includes(player.id);
        });
        
        console.log("Available players for selection:", availablePlayers.length);
        
        if (availablePlayers.length === 0) {
          if (allPlayers.length === 0) {
            toast({
              title: "No players available",
              description: "There are no players in the system yet.",
            });
          } else if (statusFilteredPlayers.length === 0) {
            toast({
              title: "No approved players",
              description: "There are no approved players in the system yet.",
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
      } catch (error) {
        console.error("Error fetching players:", error);
        toast({
          title: "Error",
          description: "Failed to load players. Please try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
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
      <div className="flex flex-col h-full">
        {/* Search input */}
        <PlayerSearchInput 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
        />
        
        {/* Selected players */}
        <div className="mt-4">
          <SelectedPlayersList 
            selectedPlayers={selectedPlayers}
            onRemovePlayer={handleSelectPlayer}
          />
        </div>
        
        {/* Player selection list */}
        <div className="mt-4 flex-grow">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <PlayerSelectionList 
              filteredPlayers={filteredPlayers}
              selectedPlayers={selectedPlayers}
              onSelectPlayer={handleSelectPlayer}
            />
          )}
        </div>
        
        {players.length === 0 && !isLoading && (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">
              No available players found. Please import players or create new ones.
            </p>
          </div>
        )}
        
        {/* Fixed position footer for buttons */}
        <div className="mt-6 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900 flex justify-end gap-2">
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
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Select Players</DialogTitle>
          <DialogDescription>
            Select one or more players to add to your tournament.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-grow overflow-hidden flex flex-col">
          <PlayerSearchInput 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
          />
          
          <div className="flex-shrink-0">
            <SelectedPlayersList 
              selectedPlayers={selectedPlayers}
              onRemovePlayer={handleSelectPlayer}
            />
          </div>
          
          <div className="flex-grow overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <PlayerSelectionList 
                filteredPlayers={filteredPlayers}
                selectedPlayers={selectedPlayers}
                onSelectPlayer={handleSelectPlayer}
              />
            )}
          </div>
          
          {players.length === 0 && !isLoading && (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No available players found. Please import players or create new ones.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4 pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900">
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
