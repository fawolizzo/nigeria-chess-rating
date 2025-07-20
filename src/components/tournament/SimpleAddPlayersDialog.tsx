import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus } from 'lucide-react';
import { Player } from '@/lib/mockData';

interface SimpleAddPlayersDialogProps {
  onPlayersAdded: (players: Player[]) => void;
  existingPlayerIds?: string[];
}

const SimpleAddPlayersDialog: React.FC<SimpleAddPlayersDialogProps> = ({
  onPlayersAdded,
  existingPlayerIds = [],
}) => {
  const [open, setOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);

  // Debug logging
  console.log('🔧 SimpleAddPlayersDialog rendered');
  console.log('🔧 Existing player IDs:', existingPlayerIds);

  // Simple mock players - always available
  const mockPlayers: Player[] = [
    {
      id: 'player-1',
      name: 'Adebayo Adebisi',
      email: 'adebayo@example.com',
      rating: 1650,
      state: 'Lagos',
      status: 'approved',
      phone: '+234-xxx-xxxx',
      city: 'Lagos',
      country: 'Nigeria',
      gamesPlayed: 25,
    },
    {
      id: 'player-2',
      name: 'Fatima Mohammed',
      email: 'fatima@example.com',
      rating: 1420,
      state: 'Kano',
      status: 'approved',
      phone: '+234-xxx-xxxx',
      city: 'Kano',
      country: 'Nigeria',
      gamesPlayed: 18,
    },
    {
      id: 'player-3',
      name: 'Chinedu Okafor',
      email: 'chinedu@example.com',
      rating: 1780,
      state: 'Anambra',
      status: 'approved',
      phone: '+234-xxx-xxxx',
      city: 'Awka',
      country: 'Nigeria',
      gamesPlayed: 32,
    },
  ];

  // Filter out already registered players
  const availablePlayers = mockPlayers.filter(
    (player) => !existingPlayerIds.includes(player.id)
  );

  console.log('🔧 Mock players:', mockPlayers.length);
  console.log('🔧 Available players:', availablePlayers.length);
  console.log(
    '🔧 Available player names:',
    availablePlayers.map((p) => p.name)
  );

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(playerId)
        ? prev.filter((id) => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleAddPlayers = () => {
    const playersToAdd = availablePlayers.filter((player) =>
      selectedPlayers.includes(player.id)
    );

    console.log('Adding players:', playersToAdd);
    onPlayersAdded(playersToAdd);
    setSelectedPlayers([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-nigeria-green hover:bg-nigeria-green-dark">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Players (Simple)
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Players to Tournament</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Available players: {availablePlayers.length}
          </p>

          {availablePlayers.length === 0 ? (
            <p className="text-center py-4 text-gray-500">
              No available players (all players already added)
            </p>
          ) : (
            <div className="space-y-3">
              {availablePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center space-x-3 p-3 border rounded"
                >
                  <Checkbox
                    checked={selectedPlayers.includes(player.id)}
                    onCheckedChange={() => handlePlayerToggle(player.id)}
                  />
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-gray-500">
                      Rating: {player.rating} • {player.state}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddPlayers}
              disabled={selectedPlayers.length === 0}
            >
              Add {selectedPlayers.length} Player
              {selectedPlayers.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleAddPlayersDialog;
