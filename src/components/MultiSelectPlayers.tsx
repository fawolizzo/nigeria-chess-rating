
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Check } from "lucide-react";
import { Player } from "@/lib/mockData";
import { getAllPlayersFromSupabase } from "@/services/playerService";

interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  excludeIds?: string[];
  includePendingPlayers?: boolean;
}

const MultiSelectPlayers: React.FC<MultiSelectPlayersProps> = ({
  isOpen,
  onOpenChange,
  onPlayersSelected,
  excludeIds = [],
  includePendingPlayers = false,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch players when the dialog opens
  useEffect(() => {
    if (isOpen) {
      const fetchPlayers = async () => {
        setIsLoading(true);
        try {
          // Use the Supabase service to get players
          const fetchedPlayers = await getAllPlayersFromSupabase({
            status: includePendingPlayers ? undefined : 'approved'
          });
          
          // Filter out already selected players by ID
          const filteredPlayers = fetchedPlayers.filter(
            player => !excludeIds.includes(player.id)
          );
          
          setPlayers(filteredPlayers);
        } catch (error) {
          console.error("Error fetching players:", error);
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchPlayers();
      setSelectedPlayers([]);
      setSearchQuery("");
    }
  }, [isOpen, excludeIds, includePendingPlayers]);
  
  // Filter players based on search query
  const filteredPlayers = players.filter(player => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(query) ||
      (player.title && player.title.toLowerCase().includes(query)) ||
      String(player.rating).includes(query)
    );
  });
  
  // Toggle player selection
  const togglePlayerSelection = (player: Player) => {
    setSelectedPlayers(prev => {
      const isSelected = prev.some(p => p.id === player.id);
      
      if (isSelected) {
        return prev.filter(p => p.id !== player.id);
      } else {
        return [...prev, player];
      }
    });
  };
  
  // Handle confirmation
  const handleConfirm = () => {
    onPlayersSelected(selectedPlayers);
    onOpenChange(false);
  };
  
  // Check if a player is selected
  const isPlayerSelected = (playerId: string) => {
    return selectedPlayers.some(player => player.id === playerId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Players to Tournament</DialogTitle>
        </DialogHeader>
        
        <div className="relative mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <div className="max-h-[400px] overflow-y-auto mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="space-y-1">
              {filteredPlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => togglePlayerSelection(player)}
                  className={`w-full flex items-center justify-between p-2 rounded-md text-left transition-colors ${
                    isPlayerSelected(player.id)
                      ? "bg-primary/10 dark:bg-primary/20"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {player.title && (
                          <span className="text-amber-500 text-sm">{player.title}</span>
                        )}
                        {player.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Rating: {player.rating}
                        {player.status === 'pending' && (
                          <span className="ml-2 text-amber-500">(Pending approval)</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isPlayerSelected(player.id) && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <p>No players match your search.</p>
              ) : (
                <p>No available players found.</p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {selectedPlayers.length} players selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={selectedPlayers.length === 0}
            >
              Add Selected
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectPlayers;
