import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Search,
  UserPlus,
  AlertTriangle,
  Loader2,
  Download,
} from 'lucide-react';
import { Player } from '@/lib/mockData';
import MultiSelectPlayers from '../MultiSelectPlayers';
import SimpleAddPlayersDialog from './SimpleAddPlayersDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import CreatePlayerDialog from '../officer/CreatePlayerDialog';
import { useToast } from '@/hooks/use-toast';

// Props interface for PlayersTab
export interface PlayersTabProps {
  tournamentId: string;
  tournamentStatus:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'upcoming'
    | 'ongoing'
    | 'completed'
    | 'processed';
  registeredPlayers?: Player[];
  allPlayers?: Player[];
  playerIds?: string[];
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
  registeredPlayers = [],
  allPlayers = [],
  playerIds = [],
  onCreatePlayer,
  onAddPlayers,
  onRemovePlayer,
  isProcessing,
  searchQuery,
  setSearchQuery,
}: PlayersTabProps) => {
  const [isSelectPlayersOpen, setIsSelectPlayersOpen] = React.useState(false);
  const { toast } = useToast();

  const handlePlayerCreated = async (playerData: any) => {
    try {
      console.log('🔧 Creating new player for tournament:', playerData);

      // Import player service to create in Supabase
      const { createPlayer } = await import(
        '@/services/player/playerCoreService'
      );

      // Create player with pending status - RO can approve later
      const newPlayerData = {
        name: playerData.fullName,
        email: `${playerData.fullName.toLowerCase().replace(/\s+/g, '.')}@temp.ncr.com`, // Temporary email
        rating: playerData.rating || 800,
        rapidRating: 800,
        blitzRating: 800,
        status: 'pending', // Set as pending - RO will approve later
        gender: playerData.gender,
        state: playerData.state,
        phone: '', // Can be added later
        gamesPlayed: 0, // New player starts with 0 games (floor rating)
        rapidGamesPlayed: 0,
        blitzGamesPlayed: 0,
        fideId: `NCR${String(Date.now()).slice(-5)}`, // Generate NCR ID
        created_at: new Date().toISOString(),
      };

      const createdPlayer = await createPlayer(newPlayerData as any);
      console.log('✅ Player created successfully:', createdPlayer);

      // Convert to Player interface format and add to tournament
      const playerForTournament: Player = {
        id: createdPlayer.id,
        name: createdPlayer.name,
        email: createdPlayer.email,
        rating: createdPlayer.rating,
        rapidRating: createdPlayer.rapidRating,
        blitzRating: createdPlayer.blitzRating,
        status: createdPlayer.status as 'approved' | 'pending' | 'rejected',
        gender: createdPlayer.gender,
        state: createdPlayer.state,
        city: createdPlayer.city || '',
        phone: createdPlayer.phone,
        gamesPlayed: createdPlayer.gamesPlayed,
        rapidGamesPlayed: createdPlayer.rapidGamesPlayed,
        blitzGamesPlayed: createdPlayer.blitzGamesPlayed,
        fideId: createdPlayer.fideId,
        country: 'Nigeria',
        title: undefined,
        // No registrationDate in Player interface
      };

      // Add the new player to the tournament
      onAddPlayers([playerForTournament]);
    } catch (error) {
      console.error('❌ Error creating player:', error);
      // You might want to show a toast notification here
    }
  };

  // Check if there are pending players
  const hasPendingPlayers = Array.isArray(registeredPlayers)
    ? registeredPlayers.some((player) => player.status === 'pending')
    : false;

  // Filter players based on search query
  const filteredPlayers = Array.isArray(registeredPlayers)
    ? registeredPlayers.filter((player) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          player.name.toLowerCase().includes(query) ||
          (player.title && player.title.toLowerCase().includes(query)) ||
          String(player.rating).includes(query) ||
          (player.country && player.country.toLowerCase().includes(query)) ||
          (player.state && player.state.toLowerCase().includes(query))
        );
      })
    : [];

  const handlePlayersSelected = (selectedPlayers: Player[]) => {
    onAddPlayers(selectedPlayers);
  };

  const canAddPlayers = tournamentStatus === 'approved';

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
              <CreatePlayerDialog onPlayerCreated={handlePlayerCreated} />

              {/* Original Add Players button removed - using SimpleAddPlayersDialog below */}
            </>
          )}
        </div>
      </div>

      {/* Registration Warnings */}
      {hasPendingPlayers && tournamentStatus === 'upcoming' && (
        <Alert
          variant="warning"
          className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 mt-4"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Some players require approval by a Rating Officer before the
            tournament can start.
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
                          <span className="text-amber-500 text-sm">
                            {player.title}
                          </span>
                        )}
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {player.rating} • {player.country || 'Nigeria'}
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
                      Click "Add Players" to select existing players or "New
                      Player" to create a new one.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Simple Add Players Dialog for Testing */}
      {canAddPlayers && (
        <div className="mt-4">
          <SimpleAddPlayersDialog
            onPlayersAdded={handlePlayersSelected}
            existingPlayerIds={playerIds}
          />
        </div>
      )}
    </div>
  );
};

export default PlayersTab;
