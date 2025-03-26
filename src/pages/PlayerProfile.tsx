
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import PlayerStorageInitializer from "@/components/player/PlayerStorageInitializer";
import PlayerProfileSkeleton from "@/components/player/PlayerProfileSkeleton";
import PlayerProfileError from "@/components/player/PlayerProfileError";
import PlayerProfileContainer from "@/components/player/PlayerProfileContainer";
import { forceSyncAllStorage } from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";
import { getPlayerById } from "@/lib/mockData";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [initialLoadAttempted, setInitialLoadAttempted] = useState(false);
  const [maxRetryAttempts] = useState(3);
  const [retryCount, setRetryCount] = useState(0);
  
  // Use the custom hook
  const { 
    player, 
    isLoading, 
    loadError, 
    loadPlayerData, 
    refreshPlayerData 
  } = usePlayerProfile(id);

  // First-run initialization with instrumentation
  useEffect(() => {
    console.log("[PlayerProfile] Component mounting, page URL:", window.location.href);
    console.log("[PlayerProfile] Player ID from URL parameters:", id);
    
    const cachedPlayerId = sessionStorage.getItem('last_viewed_player_id');
    console.log("[PlayerProfile] Cached player ID in session storage:", cachedPlayerId);
    
    // Sync storage and load data
    try {
      forceSyncAllStorage();
    } catch (storageError) {
      console.error("[PlayerProfile] Error syncing storage:", storageError);
      // Continue anyway and let the hook handle errors
    }
    
    // Check if ID exists in the URL
    if (!id) {
      console.error("[PlayerProfile] No player ID in URL parameters");
      toast({
        title: "Missing Information",
        description: "No player ID was provided. Redirecting to players list.",
        variant: "destructive",
      });
      navigate("/players");
      return;
    }
    
    // Verify the player ID exists
    try {
      const checkPlayer = getPlayerById(id);
      if (!checkPlayer) {
        console.error("[PlayerProfile] Player ID not found in database:", id);
        // Don't redirect - let the standard error handling show the error message
      }
    } catch (error) {
      console.warn("[PlayerProfile] Error checking player existence:", error);
      // Continue with normal loading flow as the hook will handle this more thoroughly
    }
    
    setInitialLoadAttempted(true);
  }, [id, navigate, toast]);

  const handleBackClick = () => {
    navigate("/players");
  };

  // Debug logs to track component lifecycle
  console.log("[PlayerProfile] Render state:", { 
    id, 
    isLoading, 
    hasError: !!loadError, 
    hasPlayer: !!player,
    initialLoadAttempted,
    retryCount,
    playerData: player ? `${player.id} - ${player.name}` : 'null'
  });

  // Fallback check if hook seems to be stuck in loading state
  useEffect(() => {
    if (isLoading && initialLoadAttempted) {
      const loadingTimer = setTimeout(() => {
        console.warn("[PlayerProfile] Loading state persisted for over 5 seconds, forcing refresh");
        loadPlayerData();
      }, 5000);
      
      return () => clearTimeout(loadingTimer);
    }
  }, [isLoading, initialLoadAttempted, loadPlayerData]);

  // Handle retry with retry count limit
  const handleRetry = () => {
    if (retryCount >= maxRetryAttempts) {
      console.warn("[PlayerProfile] Max retry attempts reached");
      toast({
        title: "Too Many Attempts",
        description: "Please return to the players list and try again later.",
        variant: "destructive",
      });
      return;
    }
    
    console.log("[PlayerProfile] Manual retry initiated by user, attempt:", retryCount + 1);
    setRetryCount(prev => prev + 1);
    
    // Clear session storage cache to ensure fresh data
    sessionStorage.removeItem('last_viewed_player_id');
    sessionStorage.removeItem('last_viewed_player');
    
    // Ensure storage is synced before retry
    forceSyncAllStorage(); 
    
    // Attempt to load data again
    loadPlayerData();
    
    toast({
      title: "Retrying",
      description: `Attempt ${retryCount + 1} of ${maxRetryAttempts} to load player data...`,
    });
  };

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
          onRetry={handleRetry}
        />
      ) : !player ? (
        <PlayerProfileError 
          error="Could not load player data. Please try again." 
          onBackClick={handleBackClick} 
          onRetry={handleRetry}
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
