
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Player } from "@/lib/mockData";
import { useUser } from "@/contexts/UserContext";
import EditPlayerDialog from "@/components/officer/EditPlayerDialog";
import PlayerProfileContent from "@/components/player/PlayerProfileContent";
import PlayerProfileHeader from "@/components/player/PlayerProfileHeader";

interface PlayerProfileContainerProps {
  player: Player;
  onEditSuccess: () => void;
}

const PlayerProfileContainer: React.FC<PlayerProfileContainerProps> = ({ 
  player, 
  onEditSuccess 
}) => {
  const navigate = useNavigate();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { currentUser } = useUser();

  // Check if the current user is a rating officer
  const isRatingOfficer = currentUser?.role === 'rating_officer';

  const handleBackToPlayers = () => {
    navigate("/players");
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
      <Button 
        variant="ghost" 
        className="mb-6 text-nigeria-green hover:text-nigeria-green-dark hover:bg-nigeria-green/5 -ml-2" 
        onClick={handleBackToPlayers}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Players
      </Button>
      
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-nigeria-green/20 shadow-card overflow-hidden">
        <PlayerProfileHeader 
          player={player}
          isRatingOfficer={isRatingOfficer}
          onEditClick={() => setIsEditDialogOpen(true)}
        />
        
        <div className="p-6 md:p-8">
          <PlayerProfileContent player={player} />
        </div>
      </div>

      {isRatingOfficer && (
        <EditPlayerDialog 
          player={player} 
          isOpen={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          onSuccess={onEditSuccess}
        />
      )}
    </div>
  );
};

export default PlayerProfileContainer;
