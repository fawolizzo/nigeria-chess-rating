
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlayerById } from "@/lib/mockData";
import Navbar from "@/components/Navbar";
import { Player } from "@/lib/mockData";
import PlayerProfileContent from "@/components/player/PlayerProfileContent";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import EditPlayerDialog from "@/components/officer/EditPlayerDialog";
import PlayerProfileSkeleton from "@/components/player/PlayerProfileSkeleton";
import PlayerProfileError from "@/components/player/PlayerProfileError";
import PlayerProfileHeader from "@/components/player/PlayerProfileHeader";
import { initializePlayerData, debugPlayer } from "@/lib/playerDataUtils";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { currentUser } = useUser();
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check if the current user is a rating officer
  const isRatingOfficer = currentUser?.role === 'rating_officer';

  useEffect(() => {
    console.log("PlayerProfile component mounting, player ID:", id);
    setIsLoading(true);
    setLoadError(null);
    
    if (!id) {
      setLoadError("No player ID provided.");
      setIsLoading(false);
      return;
    }
    
    try {
      const loadedPlayer = getPlayerById(id);
      console.log("Raw loaded player:", loadedPlayer);
      
      if (loadedPlayer) {
        // Initialize player data with all required fields
        const updatedPlayer = initializePlayerData(loadedPlayer);
        
        // Debug the prepared player data
        debugPlayer(updatedPlayer);
        
        setPlayer(updatedPlayer);
        setLoadError(null);
      } else {
        console.error("Player not found with ID:", id);
        setLoadError("Player not found. The player might have been deleted or the ID is incorrect.");
      }
    } catch (error: any) {
      console.error("Error loading player:", error);
      setLoadError(`Error loading player data: ${error.message || "Unknown error"}. Please try again.`);
    }
    
    setIsLoading(false);
  }, [id]);

  const handleEditSuccess = () => {
    // Reload player data after successful edit
    if (id) {
      try {
        const updatedPlayer = getPlayerById(id);
        if (updatedPlayer) {
          setPlayer(initializePlayerData(updatedPlayer));
        }
      } catch (error: any) {
        console.error("Error reloading player after edit:", error);
      }
    }
  };

  const handleBackToPlayers = () => {
    navigate("/players");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <PlayerProfileSkeleton />
        </div>
      </div>
    );
  }

  if (!player || loadError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <PlayerProfileError error={loadError} onBackClick={handleBackToPlayers} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
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
            {player && <PlayerProfileContent player={player} />}
          </div>
        </div>
      </div>

      {isRatingOfficer && player && (
        <EditPlayerDialog 
          player={player} 
          isOpen={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default PlayerProfile;
