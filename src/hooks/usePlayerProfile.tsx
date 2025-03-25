
import { useState, useEffect, useCallback } from "react";
import { Player } from "@/lib/mockData";
import { getPlayerById } from "@/lib/mockData";
import { initializePlayerData } from "@/lib/playerDataUtils";
import { 
  syncStorage, 
  forceSyncAllStorage, 
  validatePlayerData 
} from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for loading and managing player profile data
 */
export const usePlayerProfile = (playerId: string | undefined) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const { toast } = useToast();

  // Function to load player data, can be called for retries
  const loadPlayerData = useCallback(() => {
    console.log(`Loading player data for ID: ${playerId}, attempt: ${loadAttempts + 1}`);
    setIsLoading(true);
    setLoadError(null);
    setLoadAttempts(prev => prev + 1);
    
    if (!playerId) {
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
        
        const loadedPlayer = getPlayerById(playerId);
        console.log("Raw loaded player:", loadedPlayer);
        
        if (loadedPlayer) {
          // Validate player data
          if (!validatePlayerData(loadedPlayer)) {
            throw new Error("Player data is incomplete or invalid");
          }
          
          // Initialize player data with all required fields
          const updatedPlayer = initializePlayerData(loadedPlayer);
          
          setPlayer(updatedPlayer);
          setLoadError(null);
        } else {
          console.error("Player not found with ID:", playerId);
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
    }, 500); // Delay for better chance of data synchronization
    
    return () => clearTimeout(loadPlayerTimer);
  }, [playerId, loadAttempts, toast]);

  // Load player data after ID changes
  useEffect(() => {
    console.log("PlayerProfile hook mounting or ID changing, player ID:", playerId);
    loadPlayerData();
  }, [playerId, loadPlayerData]);

  // Function to update player data (e.g., after edits)
  const refreshPlayerData = useCallback(() => {
    // Force sync and reload player data after successful edit
    forceSyncAllStorage();
    
    if (playerId) {
      try {
        const updatedPlayer = getPlayerById(playerId);
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
  }, [playerId, toast]);

  return {
    player,
    isLoading,
    loadError,
    loadPlayerData, // For retrying
    refreshPlayerData, // For refreshing after edits
  };
};
