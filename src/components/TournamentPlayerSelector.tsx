
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, Search } from "lucide-react";
import { Player, getAllPlayers } from "@/lib/mockData";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { MultiSelectPlayers } from "@/components/MultiSelectPlayers";

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
  
  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };
  
  const handlePlayersAdded = (players: Player[]) => {
    onPlayersAdded(players);
    setIsDialogOpen(false);
  };

  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={handleOpenDialog}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Existing Player
        <ChevronDown className="h-4 w-4 ml-2" />
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
