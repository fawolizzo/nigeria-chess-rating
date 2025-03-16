
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
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
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={() => setIsMultiSelectOpen(true)}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add Multiple Players
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
