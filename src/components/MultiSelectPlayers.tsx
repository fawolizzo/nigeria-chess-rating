
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
// import { getAllPlayers, Player } from "@/lib/mockData"; // Removed getAllPlayers
import { Player } from "@/lib/mockData"; // Kept Player
import { getAllPlayersFromSupabase } from "@/services/playerService"; // Added Supabase service
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react"; // Added Loader2 for loading state

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
  const [players, setPlayers] = useState<Player[]>([]); // Stores available players for selection
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isLoadingDialog, setIsLoadingDialog] = useState(false);

  useEffect(() => {
    const fetchPlayersData = async () => {
      if (!isOpen) return;

      setIsLoadingDialog(true);
      try {
        const filterOptions = includePendingPlayers ? {} : { status: 'approved' };
        const fetchedPlayers = await getAllPlayersFromSupabase(filterOptions);
        
        console.log(`Fetched ${fetchedPlayers.length} players from Supabase. Include pending: ${includePendingPlayers}`);
        
        const availablePlayers = fetchedPlayers.filter(player => 
          !excludeIds.includes(player.id)
        );
        
        console.log("Available players for selection:", availablePlayers.length);
        
        if (availablePlayers.length === 0) {
          if (fetchedPlayers.length === 0) {
            toast({
              title: "No Players Available",
              description: includePendingPlayers 
                ? "There are no players in the system." 
                : "There are no approved players in the system.",
              variant: "default"
            });
          } else {
            toast({
              title: "All Eligible Players Excluded",
              description: "All eligible players are already in the list or excluded.",
              variant: "default"
            });
          }
        }
        
        setPlayers(availablePlayers);
        setFilteredPlayers(availablePlayers); // Initially show all available players
      } catch (error) {
        console.error("Failed to fetch players for MultiSelect:", error);
        toast({ title: "Error", description: "Could not load players. Please try again.", variant: "destructive" });
        setPlayers([]);
        setFilteredPlayers([]);
      } finally {
        setIsLoadingDialog(false);
      }
    };
    
    fetchPlayersData();
  }, [isOpen, includePendingPlayers, excludeIds, toast]); // excludeIds needs to be a dependency

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
          <PlayerSelectionList 
            filteredPlayers={filteredPlayers}
            selectedPlayers={selectedPlayers}
            onSelectPlayer={handleSelectPlayer}
          />
        </div>
        
        {players.length === 0 && (
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
          
          <div className="flex-shrink-0"> {/* Ensures this part doesn't grow excessively */}
            <SelectedPlayersList 
              selectedPlayers={selectedPlayers}
              onRemovePlayer={handleSelectPlayer}
            />
          </div>
          
          {isLoadingDialog ? (
            <div className="flex-grow flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="flex-grow overflow-hidden"> {/* Allows PlayerSelectionList to scroll */}
              <PlayerSelectionList 
                filteredPlayers={filteredPlayers}
                selectedPlayers={selectedPlayers}
                onSelectPlayer={handleSelectPlayer}
              />
            </div>
          )}
          
          {!isLoadingDialog && players.length === 0 && (
            <div className="text-center py-6 flex-grow flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                No available players found.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-auto pt-4 border-t sticky bottom-0 bg-white dark:bg-gray-900"> {/* mt-auto pushes footer down */}
          <Button variant="outline" onClick={handleCancel} disabled={isLoadingDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSelection} 
            disabled={selectedPlayers.length === 0 || isLoadingDialog}
          >
            Add {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectPlayers;
