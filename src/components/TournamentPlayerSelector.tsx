
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import MultiSelectPlayers from "./MultiSelectPlayers";
import { Player } from "@/lib/mockData";

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
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);

  const handlePlayersSelected = (selectedPlayers: Player[]) => {
    onPlayersAdded(selectedPlayers);
    setIsMultiSelectOpen(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={() => setIsMultiSelectOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Existing Player
      </Button>
      
      <MultiSelectPlayers
        isOpen={isMultiSelectOpen}
        onOpenChange={setIsMultiSelectOpen}
        onPlayersSelected={handlePlayersSelected}
        excludeIds={existingPlayerIds}
      />
    </>
  );
};

export default TournamentPlayerSelector;
