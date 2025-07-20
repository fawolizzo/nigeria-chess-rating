import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Loader2 } from 'lucide-react';
import { Player } from '@/lib/mockData';

interface MultiSelectPlayersProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayersSelected: (players: Player[]) => void;
  excludePlayerIds?: string[];
  allPlayers?: Player[];
  includePendingPlayers?: boolean;
}

const MultiSelectPlayers = ({
  isOpen,
  onOpenChange,
  onPlayersSelected,
  excludePlayerIds = [],
  allPlayers = [],
  includePendingPlayers = false,
}: MultiSelectPlayersProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter available players
  const availablePlayers = allPlayers.filter((player) => {
    // Exclude already registered players
    if (excludePlayerIds.includes(player.id)) return false;

    // Include/exclude pending players based on prop
    if (!includePendingPlayers && player.status === 'pending') return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        player.name.toLowerCase().includes(query) ||
        String(player.rating).includes(query) ||
        (player.state && player.state.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayerIds((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleSelectAll = () => {
    if (selectedPlayerIds.length === availablePlayers.length) {
      setSelectedPlayerIds([]);
    } else {
      setSelectedPlayerIds(availablePlayers.map((p) => p.id));
    }
  };

  const handleAddPlayers = () => {
    const selectedPlayers = allPlayers.filter((player) =>
      selectedPlayerIds.includes(player.id)
    );
    onPlayersSelected(selectedPlayers);
    setSelectedPlayerIds([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  // Reset selections when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedPlayerIds([]);
      setSearchQuery('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Players to Tournament</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Search players by name, rating, or state..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Select All */}
          {availablePlayers.length > 0 && (
            <div className="flex items-center gap-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectedPlayerIds.length === availablePlayers.length}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium cursor-pointer"
              >
                Select All ({availablePlayers.length} players)
              </label>
            </div>
          )}

          {/* Players List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : availablePlayers.length > 0 ? (
              availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedPlayerIds.includes(player.id)
                      ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                  onClick={() => handlePlayerToggle(player.id)}
                >
                  <Checkbox
                    checked={selectedPlayerIds.includes(player.id)}
                    onCheckedChange={() => handlePlayerToggle(player.id)}
                  />

                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-medium">
                    {player.name.charAt(0)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {player.title && (
                        <span className="text-amber-500 text-sm font-medium">
                          {player.title}
                        </span>
                      )}
                      <span className="font-medium">{player.name}</span>
                      {player.status === 'pending' && (
                        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Rating: {player.rating} • {player.state || 'Nigeria'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                {searchQuery ? (
                  <p>No players match your search criteria.</p>
                ) : (
                  <p>No available players to add.</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-gray-500">
              {selectedPlayerIds.length} player
              {selectedPlayerIds.length !== 1 ? 's' : ''} selected
            </p>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayers}
                disabled={selectedPlayerIds.length === 0}
              >
                Add {selectedPlayerIds.length} Player
                {selectedPlayerIds.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiSelectPlayers;
