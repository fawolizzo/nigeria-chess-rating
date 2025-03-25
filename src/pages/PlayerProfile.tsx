
import React, { useEffect, useState, useCallback } from "react";
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
import { 
  syncStorage, 
  forceSyncAllStorage, 
  initializeStorageListeners,
  validatePlayerData
} from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { currentUser } = useUser();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const { toast } = useToast();

  // Check if the current user is a rating officer
  const isRatingOfficer = currentUser?.role === 'rating_officer';

  // Initialize storage listeners on mount
  useEffect(() => {
    initializeStorageListeners();
  }, []);

  // Function to load player data, can be called for retries
  const loadPlayerData = useCallback(() => {
    console.log(`Loading player data for ID: ${id}, attempt: ${loadAttempts + 1}`);
    setIsLoading(true);
    setLoadError(null);
    setLoadAttempts(prev => prev + 1);
    
    if (!id) {
      setLoadError("No player ID provided.");
      setIsLoading(false);
      return;
    }
    
    // Force sync all storage to ensure we have the latest data
    forceSyncAllStorage();
    
    // Add a small delay to ensure data is synchronized
    const loadPlayerTimer = setTimeout(() => {
      try {
        // Specifically sync the players data
        syncStorage('ncr_players');
        
        const loadedPlayer = getPlayerById(id);
        console.log("Raw loaded player:", loadedPlayer);
        
        if (loadedPlayer) {
          // Validate player data
          if (!validatePlayerData(loadedPlayer)) {
            throw new Error("Player data is incomplete or invalid");
          }
          
          // Initialize player data with all required fields
          const updatedPlayer = initializePlayerData(loadedPlayer);
          
          // Debug the prepared player data
          debugPlayer(updatedPlayer);
          
          setPlayer(updatedPlayer);
          setLoadError(null);
        } else {
          console.error("Player not found with ID:", id);
          setLoadError("Player not found. The player might have been deleted or the ID is incorrect.");
          
          toast({
            title: "Player Not Found",
            description: "The player you're looking for doesn't exist or has been removed.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error("Error loading player:", error);
        setLoadError(`Error loading player data: ${error.message || "Unknown error"}. Please try again.`);
        
        toast({
          title: "Error Loading Profile",
          description: `${error.message || "An unknown error occurred"}. Please try again.`,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }, 500); // Increased delay for better chance of data synchronization
    
    return () => clearTimeout(loadPlayerTimer);
  }, [id, loadAttempts, toast]);

  // Load player data when component mounts or ID changes
  useEffect(() => {
    console.log("PlayerProfile component mounting or ID changing, player ID:", id);
    loadPlayerData();
  }, [id, loadPlayerData]);

  const handleEditSuccess = () => {
    // Force sync and reload player data after successful edit
    forceSyncAllStorage();
    
    if (id) {
      try {
        const updatedPlayer = getPlayerById(id);
        if (updatedPlayer) {
          setPlayer(initializePlayerData(updatedPlayer));
          
          toast({
            title: "Profile Updated",
            description: "The player profile has been successfully updated.",
          });
        }
      } catch (error: any) {
        console.error("Error reloading player after edit:", error);
        toast({
          title: "Update Error",
          description: "Could not reload player data after update.",
          variant: "destructive",
        });
      }
    }
  };

  const handleBackToPlayers = () => {
    navigate("/players");
  };

  // Handle retry logic
  const handleRetry = () => {
    console.log("Retrying player data load...");
    loadPlayerData();
  };

  if (isLoading) {
    return <PlayerProfileSkeleton onBackClick={handleBackToPlayers} />;
  }

  if (!player || loadError) {
    return (
      <PlayerProfileError 
        error={loadError} 
        onBackClick={handleBackToPlayers} 
        onRetry={handleRetry}
      />
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
