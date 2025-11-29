import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  searchPlayers,
  addExistingPlayerToTournament,
  createAndAddPlayerToTournament,
  getTournamentPlayers,
} from '../api/addPlayerToTournament';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, Plus, Users, Star } from 'lucide-react';
import { getAllStates } from '@/data/nigeriaStates';

const newPlayerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  state: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
});

type NewPlayerFormData = z.infer<typeof newPlayerSchema>;

interface PlayerAdderProps {
  tournamentId: string;
  onPlayerAdded?: () => void;
}

interface Player {
  id: string;
  full_name: string;
  state: string | null;
  classical_rating: number;
  rapid_rating: number;
  blitz_rating: number;
  status: string;
}

interface TournamentPlayer {
  id?: string;
  player_id: string;
  seed_rating?: number;
  score?: number;
  withdrawn?: boolean;
  players: Player;
}

export function PlayerAdder({ tournamentId, onPlayerAdded }: PlayerAdderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [tournamentPlayers, setTournamentPlayers] = useState<
    TournamentPlayer[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NewPlayerFormData>({
    resolver: zodResolver(newPlayerSchema),
  });

  // Load tournament players
  const loadTournamentPlayers = async () => {
    const result = await getTournamentPlayers(tournamentId);
    if (result.success) {
      setTournamentPlayers(result.players as TournamentPlayer[]);
    }
  };

  useEffect(() => {
    loadTournamentPlayers();
  }, [tournamentId]);

  // Search for players
  useEffect(() => {
    const searchForPlayers = async () => {
      if (searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const result = await searchPlayers(searchQuery);

      if (result.success) {
        // Filter out players already in tournament
        const registeredPlayerIds = new Set(
          tournamentPlayers.map((tp) => tp.player_id)
        );
        const availablePlayers = result.players.filter(
          (p) => !registeredPlayerIds.has(p.id)
        );
        setSearchResults(availablePlayers);
      } else {
        setError(result.error || 'Search failed');
      }

      setIsSearching(false);
    };

    const debounceTimer = setTimeout(searchForPlayers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, tournamentPlayers]);

  const handleAddExistingPlayer = async (playerId: string) => {
    if (!user?.id) return;

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await addExistingPlayerToTournament({
        tournamentId,
        playerId,
        organizerId: user.id,
      });

      if (result.success) {
        setSuccess(`Player added successfully!`);
        setSearchQuery('');
        setSearchResults([]);
        await loadTournamentPlayers();
        onPlayerAdded?.();
      } else {
        setError(result.error || 'Failed to add player');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCreateNewPlayer = async (data: NewPlayerFormData) => {
    if (!user?.id) return;

    setIsAdding(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createAndAddPlayerToTournament({
        tournamentId,
        organizerId: user.id,
        playerData: {
          fullName: data.fullName,
          state: data.state,
          gender: data.gender,
        },
      });

      if (result.success) {
        setSuccess(`New player "${data.fullName}" created and added!`);
        reset();
        await loadTournamentPlayers();
        onPlayerAdded?.();
      } else {
        setError(result.error || 'Failed to create player');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Registered Players
            <Badge variant="secondary">{tournamentPlayers.length}</Badge>
          </CardTitle>
          <CardDescription>
            Players currently registered for this tournament
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentPlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No players registered yet. Add players below to get started.
            </p>
          ) : (
            <div className="space-y-2">
              {tournamentPlayers.map((tp) => (
                <div
                  key={tp.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{tp.players.full_name}</div>
                    <div className="text-sm text-gray-600">
                      {tp.players.state && `${tp.players.state} • `}
                      Seed Rating: {tp.seed_rating}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {tp.players.status === 'pending' && (
                      <Badge variant="outline">Pending</Badge>
                    )}
                    <Star className="h-4 w-4 text-yellow-500" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Players */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Players
          </CardTitle>
          <CardDescription>
            Search for existing players or create new ones
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">Search Existing</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Players</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Type player name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>

              {searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <div className="font-medium">{player.full_name}</div>
                        <div className="text-sm text-gray-600">
                          {player.state && `${player.state} • `}
                          Classical: {player.classical_rating} • Rapid:{' '}
                          {player.rapid_rating} • Blitz: {player.blitz_rating}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAddExistingPlayer(player.id)}
                        disabled={isAdding}
                      >
                        {isAdding ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 &&
                searchResults.length === 0 &&
                !isSearching && (
                  <p className="text-gray-500 text-center py-4">
                    No players found. Try creating a new player instead.
                  </p>
                )}
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <form
                onSubmit={handleSubmit(handleCreateNewPlayer)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="Enter player's full name"
                    {...register('fullName')}
                    disabled={isAdding}
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="state">State (Optional)</Label>
                    <Select
                      onValueChange={(value) => setValue('state', value)}
                      disabled={isAdding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAllStates().map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender (Optional)</Label>
                    <Select
                      onValueChange={(value: 'M' | 'F') =>
                        setValue('gender', value)
                      }
                      disabled={isAdding}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> New players will be created with
                    default ratings (800) and pending status. They can
                    participate in tournaments immediately.
                  </p>
                </div>

                <Button type="submit" disabled={isAdding} className="w-full">
                  {isAdding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Player...
                    </>
                  ) : (
                    'Create and Add Player'
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
