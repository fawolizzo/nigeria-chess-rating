
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Player } from "@/lib/mockData";
import { MultiSelectPlayers } from "@/components/MultiSelectPlayers";
import { useToast } from "@/components/ui/use-toast";

interface TournamentPlayerSelectorProps {
  tournamentId: string;
  existingPlayerIds: string[];
  onPlayersAdded: (players: Player[]) => void;
}

const TournamentPlayerSelector = ({ 
  tournamentId,
  existingPlayerIds,
  onPlayersAdded 
}: TournamentPlayerSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const handlePlayersAdded = (players: Player[]) => {
    // Verify all players are approved
    const unapprovedPlayers = players.filter(player => player.status !== 'approved');
    
    if (unapprovedPlayers.length > 0) {
      toast({
        title: "Cannot add unapproved players",
        description: "Only players approved by a Rating Officer can be added to tournaments.",
        variant: "destructive"
      });
      return;
    }
    
    onPlayersAdded(players);
    setIsDialogOpen(false);
  };
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Existing Player
      </Button>
      
      <MultiSelectPlayers 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onPlayersSelected={handlePlayersAdded}
        excludeIds={existingPlayerIds}
      />
    </div>
  );
};

export default TournamentPlayerSelector;
