
import React, { useState } from "react";
import { Player } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import PlayerProfileHeader from "./PlayerProfileHeader";
import PlayerProfileContent from "./PlayerProfileContent";
import EditPlayerDialog from "../officer/EditPlayerDialog";

interface PlayerProfileContainerProps {
  player: Player;
  onPlayerUpdate?: (updatedPlayer: Player) => void;
}

const PlayerProfileContainer: React.FC<PlayerProfileContainerProps> = ({ 
  player, 
  onPlayerUpdate 
}) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const handlePlayerSave = (updatedPlayer: Player) => {
    if (onPlayerUpdate) {
      onPlayerUpdate(updatedPlayer);
    }
    toast({
      title: "Player Updated",
      description: "Player information has been updated successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <PlayerProfileHeader 
        player={player} 
        onEditClick={() => setIsEditDialogOpen(true)}
      />
      <PlayerProfileContent player={player} />
      
      <EditPlayerDialog
        player={player}
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handlePlayerSave}
      />
    </div>
  );
};

export default PlayerProfileContainer;
