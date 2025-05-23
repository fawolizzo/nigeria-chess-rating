
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react"; // Removed unused UserPlus, X, Users
import { Player } from "@/lib/mockData"; // Removed addPlayer, getAllPlayers
import { MultiSelectPlayers } from "@/components/MultiSelectPlayers";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/UserContext";

interface TournamentPlayerSelectorProps {
  tournamentId: string;
  existingPlayerIds: string[];
  onPlayersAdded: (players: Player[]) => void;
  // allPlayers?: Player[]; // Removed: MultiSelectPlayers fetches its own data
  disabled?: boolean; // Added to pass down isProcessing state
}

const TournamentPlayerSelector = ({ 
  tournamentId,
  existingPlayerIds,
  onPlayersAdded,
  disabled 
}: TournamentPlayerSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const [pendingPlayersExist, setPendingPlayersExist] = useState(false); // Removed, alert is handled by parent or MultiSelect
  const { toast } = useToast(); // Toast is used in handlePlayersSelected in the original code, but removed in my previous simplification. Re-evaluating.
  // const { currentUser } = useUser(); // Not used
  
  const handlePlayersSelected = (players: Player[]) => {
    // The parent component (PlayersTab -> TournamentManagement) will show toasts 
    // related to pending players if necessary, upon receiving the players.
    // However, the original code for TournamentPlayerSelector DID have a toast for pending players.
    // Let's reinstate a generic one if any pending players are selected, as a direct feedback.
    const pendingSelected = players.filter(p => p.status === 'pending');
    if (pendingSelected.length > 0) {
      toast({
        title: "Players Selected Include Pending",
        description: `${pendingSelected.length} selected player(s) still require Rating Officer approval.`,
        variant: "warning",
        duration: 5000,
      });
    }

    // The parent component (PlayersTab -> TournamentManagement) will show toasts 
    // related to pending players if necessary, upon receiving the players.
    onPlayersAdded(players);
    setIsDialogOpen(false);
  };
  
  // Simplified dialog open/close logic
  const handleDialogVisibilityChange = (open: boolean) => {
    setIsDialogOpen(open);
  };
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={() => setIsDialogOpen(true)} // Directly open dialog
        disabled={disabled} // Use disabled prop
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Players
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={handleDialogVisibilityChange}>
        <DialogContent className="sm:max-w-[600px]"> {/* Consider responsive width like sm:max-w-lg or md:max-w-xl */}
          <DialogHeader>
            <DialogTitle>Add Players to Tournament</DialogTitle>
            <DialogDescription>
              Select existing players to add to this tournament.
            </DialogDescription>
          </DialogHeader>
          
          {/* 
            The alert about pending players is better handled by PlayersTab or MultiSelectPlayers directly
            if it needs to be shown based on the fetched list within MultiSelectPlayers.
            Removing from here to simplify and avoid redundant checks.
          */}
          {/* {pendingPlayersExist && (...)} */}
          
          <MultiSelectPlayers
            isOpen={isDialogOpen} // This prop might be redundant if MultiSelectPlayers is only rendered when Dialog is open
            onOpenChange={handleDialogVisibilityChange} // Pass down to allow MultiSelect to close dialog
            onPlayersSelected={handlePlayersSelected}
            excludeIds={existingPlayerIds}
            hideDialog={true} // MultiSelectPlayers renders its own UI, not another dialog
            includePendingPlayers={true} // Always include pending for selection, parent handles implications
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPlayerSelector;
