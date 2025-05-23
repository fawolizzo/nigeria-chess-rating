
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, UserPlus, AlertTriangle, Loader2 } from "lucide-react";
import { Player } from "@/lib/mockData";
import MultiSelectPlayers from "../MultiSelectPlayers";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface PlayersTabProps {
  tournamentId: string;
  tournamentStatus: "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed";
  registeredPlayers: Player[];
  allPlayers: Player[];
  playerIds: string[];
  onCreatePlayer: () => void;
  onAddPlayers: (selectedPlayers: Player[]) => void;
  onRemovePlayer: (playerId: string) => void;
  isProcessing: boolean;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const PlayersTab = ({
  tournamentId,
  tournamentStatus,
  registeredPlayers,
  allPlayers,
  playerIds,
  onCreatePlayer,
  onAddPlayers,
  onRemovePlayer,
  isProcessing,
  searchQuery,
  setSearchQuery
}: PlayersTabProps) => {
  const [isSelectPlayersOpen, setIsSelectPlayersOpen] = React.useState(false);
  
  // Check if there are pending players
  const hasPendingPlayers = registeredPlayers.some(player => player.status === 'pending');
  
  // Filter players based on search query
  const filteredPlayers = registeredPlayers.filter(player => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(query) ||
      (player.title && player.title.toLowerCase().includes(query)) ||
      String(player.rating).includes(query) ||
      (player.country && player.country.toLowerCase().includes(query)) ||
      (player.state && player.state.toLowerCase().includes(query))
    );
  });
  
  const handlePlayersSelected = async (selectedPlayers: Player[]) => {
    await onAddPlayers(selectedPlayers);
  };
  
  const canAddPlayers = tournamentStatus === "upcoming";

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
          <Input
            type="search"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full md:w-[300px]"
          />
        </div>
        
        <div className="flex gap-2">
          {canAddPlayers && (
            <>
              <Button 
                variant="outline" 
                onClick={onCreatePlayer} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                New Player
              </Button>
              
              <Button 
                variant="default" 
                onClick={() => setIsSelectPlayersOpen(true)} 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <UserPlus size={16} />
                Add Players
              </Button>
            </>
          )}
        </div>
      </div>
      
      {/* Registration Warnings */}
      {hasPendingPlayers && tournamentStatus === "upcoming" && (
        <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 mt-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some players require approval by a Rating Officer before the tournament can start.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Players List */}
      {isProcessing ? (
        <div className="flex justify-center py-8">
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading players...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className={`p-4 rounded-md border ${
                  player.status === 'pending' 
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800' 
                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                }`}
              >
                <div className="flex justify-between">
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      {player.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        {player.title && (
                          <span className="text-amber-500 text-sm">{player.title}</span>
                        )}
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {player.rating} • {player.country || "Nigeria"}
                      </div>
                    </div>
                  </div>
                  
                  {canAddPlayers && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemovePlayer(player.id)}
                      disabled={isProcessing}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                
                {player.status === 'pending' && (
                  <div className="mt-2 flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-sm px-2 py-1 text-xs">
                    <AlertTriangle size={12} />
                    Pending approval
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                <p>No players match your search.</p>
              ) : (
                <div className="space-y-2">
                  <p>No players have been added to this tournament yet.</p>
                  {canAddPlayers && (
                    <p>
                      Click "Add Players" to select existing players or "New Player" to create a new one.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Multi-Select Players Modal */}
      {canAddPlayers && (
        <MultiSelectPlayers
          isOpen={isSelectPlayersOpen}
          onOpenChange={setIsSelectPlayersOpen}
          onPlayersSelected={handlePlayersSelected}
          excludePlayerIds={playerIds}
          allPlayers={allPlayers}
        />
      )}
    </div>
  );
};

export default PlayersTab;
