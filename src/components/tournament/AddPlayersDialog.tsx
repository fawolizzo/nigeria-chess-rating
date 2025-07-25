import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Search, Users } from 'lucide-react';
import { Player } from '@/lib/mockData';
import { supabaseAdmin } from '@/integrations/supabase/adminClient';
import { useToast } from '@/hooks/use-toast';

interface AddPlayersDialogProps {
  onPlayersAdded: (players: Player[]) => void;
  existingPlayerIds?: string[];
}

const AddPlayersDialog: React.FC<AddPlayersDialogProps> = ({
  onPlayersAdded,
  existingPlayerIds = [],
}) => {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load players when dialog opens
  useEffect(() => {
    if (open) {
      loadPlayers();
    }
  }, [open]);

  const loadPlayers = async () => {
    setLoading(true);
    try {
      console.log('Loading players from database...');

      // Try to load from database first
      try {
        const { data, error } = await supabaseAdmin
          .from('players')
          .select('id, name, email, rating, state, status, phone, city')
          .eq('status', 'approved');

        if (!error && data && data.length > 0) {
          console.log('Found players from database:', data.length);

          // Filter out players already in tournament and map to correct Player type
          const availablePlayers = data.filter(
            (player) => !existingPlayerIds.includes(player.id)
          ).map(player => ({
            ...player,
            phone: player.phone || '',
            city: player.city || '',
            status: player.status as 'pending' | 'approved' | 'rejected',
            country: 'Nigeria',
            gamesPlayed: 0
          }));

          setPlayers(availablePlayers);
          return;
        }
      } catch (dbError) {
        console.log('Database not available, using mock data');
      }

      // Fallback to mock data if database is empty or unavailable
      console.log('Using mock player data...');
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
        {
          id: 'player-4',
          name: 'Aisha Bello',
          email: 'aisha@example.com',
          rating: 1520,
          state: 'Abuja',
          status: 'approved',
          phone: '+234-xxx-xxxx',
          city: 'Abuja',
          country: 'Nigeria',
          gamesPlayed: 22,
        },
        {
          id: 'player-5',
          name: 'Emeka Nwankwo',
          email: 'emeka@example.com',
          rating: 1890,
          state: 'Rivers',
          status: 'approved',
          phone: '+234-xxx-xxxx',
          city: 'Port Harcourt',
          country: 'Nigeria',
          gamesPlayed: 45,
        },
      ];

      // Filter out players already in tournament
      const availablePlayers = mockPlayers.filter(
        (player) => !existingPlayerIds.includes(player.id)
      );

      console.log('Mock players loaded:', availablePlayers.length);
      setPlayers(availablePlayers);
    } catch (error) {
      console.error('Failed to load players:', error);
      toast({
        title: 'Error',
        description: 'Could not load players. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter players based on search
  const filteredPlayers = players.filter((player) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      player.name.toLowerCase().includes(query) ||
      (player.email && player.email.toLowerCase().includes(query))
    );
  });

  const handlePlayerToggle = (player: Player, checked: boolean) => {
    if (checked) {
      setSelectedPlayers((prev) => [...prev, player]);
    } else {
      setSelectedPlayers((prev) => prev.filter((p) => p.id !== player.id));
    }
  };

  const handleAddPlayers = () => {
    if (selectedPlayers.length === 0) return;

    onPlayersAdded(selectedPlayers);
    setSelectedPlayers([]);
    setOpen(false);

    toast({
      title: 'Success',
      description: `Added ${selectedPlayers.length} player(s) to tournament`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-nigeria-green hover:bg-nigeria-green-dark">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Players
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Select Players
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search players by name or player ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Players List */}
          <div className="max-h-96 overflow-y-auto space-y-2">
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                Loading players...
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No players available
              </div>
            ) : (
              filteredPlayers.map((player) => {
                const isSelected = selectedPlayers.some(
                  (p) => p.id === player.id
                );

                return (
                  <div
                    key={player.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'border-gray-200'
                    }`}
                    onClick={() => handlePlayerToggle(player, !isSelected)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onChange={() => {}} // Handled by parent click
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Rating: {player.rating || 'Unrated'}
                        {player.state && ` • ${player.state}`}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t">
            <div className="text-sm text-gray-600">
              {selectedPlayers.length} selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPlayers}
                disabled={selectedPlayers.length === 0}
                className="bg-nigeria-green hover:bg-nigeria-green-dark"
              >
                Add {selectedPlayers.length} Player
                {selectedPlayers.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayersDialog;
