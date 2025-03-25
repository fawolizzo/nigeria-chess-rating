
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import PlayerStorageInitializer from "@/components/player/PlayerStorageInitializer";
import PlayerProfileSkeleton from "@/components/player/PlayerProfileSkeleton";
import PlayerProfileError from "@/components/player/PlayerProfileError";
import PlayerProfileContainer from "@/components/player/PlayerProfileContainer";
import { forceSyncAllStorage } from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    player, 
    isLoading, 
    loadError, 
    loadPlayerData, 
    refreshPlayerData 
  } = usePlayerProfile(id);

  // Sync storage and force reload data on component mount
  useEffect(() => {
    console.log("[PlayerProfile] Component mounting, syncing storage");
    forceSyncAllStorage();
    
    // If no ID was provided, redirect back to players list
    if (!id) {
      console.error("[PlayerProfile] No player ID in URL parameters");
      toast({
        title: "Invalid Request",
        description: "No player ID was provided. Redirecting to players list.",
        variant: "destructive",
      });
      navigate("/players");
    }
  }, [id, navigate, toast]);

  const handleBackClick = () => {
    navigate("/players");
  };

  // Extra debug logging to help diagnose render issues
  console.log("[PlayerProfile] Render state:", { 
    id, 
    isLoading, 
    hasError: !!loadError, 
    hasPlayer: !!player,
    playerData: player ? JSON.stringify(player).substring(0, 100) + '...' : 'null'
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      {/* Always render the storage initializer */}
      <PlayerStorageInitializer />
      
      {isLoading ? (
        <PlayerProfileSkeleton onBackClick={handleBackClick} />
      ) : loadError && !player ? (
        <PlayerProfileError 
          error={loadError} 
          onBackClick={handleBackClick} 
          onRetry={loadPlayerData}
        />
      ) : !player ? (
        <PlayerProfileError 
          error="Could not load player data. Please try again." 
          onBackClick={handleBackClick} 
          onRetry={loadPlayerData}
        />
      ) : (
        <PlayerProfileContainer 
          player={player} 
          onEditSuccess={refreshPlayerData} 
        />
      )}
    </div>
  );
};

export default PlayerProfile;
