import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, UserPlus, X, Users, AlertTriangle } from 'lucide-react';
import { Player } from '@/lib/mockData';
import MultiSelectPlayers from '@/components/MultiSelectPlayers';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { v4 as uuidv4 } from 'uuid';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/contexts/user/index';
import { getAllPlayersFromSupabase } from '@/services/playerService';

interface TournamentPlayerSelectorProps {
  tournamentId: string;
  existingPlayerIds: string[];
  onPlayersAdded: (players: Player[]) => void;
}

const TournamentPlayerSelector = ({
  tournamentId,
  existingPlayerIds,
  onPlayersAdded,
}: TournamentPlayerSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingPlayersExist, setPendingPlayersExist] = useState(false);
  const { toast } = useToast();
  const { currentUser } = useUser();

  const handlePlayersSelected = (players: Player[]) => {
    // Check if any players are pending
    const pendingPlayers = players.filter(
      (player) => player.status === 'pending'
    );

    if (pendingPlayers.length > 0) {
      toast({
        title: 'Some players require approval',
        description: `${pendingPlayers.length} selected player(s) require approval from a Rating Officer before they can be used in tournaments.`,
        variant: 'warning',
      });
    }

    // We'll add all players, but tournament logic will handle pending players appropriately
    onPlayersAdded(players);
    setIsDialogOpen(false);
  };

  const handleDialogClose = async (open: boolean) => {
    if (!open) {
      setIsDialogOpen(open);
    } else {
      // Check for pending players when opening dialog
      try {
        const allPlayers = await getAllPlayersFromSupabase({});
        console.log('All players in system:', allPlayers);
        const hasPendingPlayers = allPlayers.some(
          (player) => player.status === 'pending'
        );
        setPendingPlayersExist(hasPendingPlayers);
        setIsDialogOpen(open);
      } catch (error) {
        console.error('Error checking for pending players:', error);
        setIsDialogOpen(open);
      }
    }
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        className="text-sm"
        onClick={() => handleDialogClose(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Players
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Players to Tournament</DialogTitle>
            <DialogDescription>
              Select existing players for your tournament
            </DialogDescription>
          </DialogHeader>

          {pendingPlayersExist && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-sm">
              <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-700">
                Some players need approval from a Rating Officer before they can
                participate in tournaments. You can include them in your
                selection, but the tournament cannot start until all players are
                approved.
              </p>
            </div>
          )}

          <MultiSelectPlayers
            isOpen={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) handleDialogClose(false);
            }}
            onPlayersSelected={handlePlayersSelected}
            excludePlayerIds={existingPlayerIds}
            hideDialog={true}
            includePendingPlayers={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPlayerSelector;
