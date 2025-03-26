
import { useState, useEffect, useCallback } from "react";
import { Player } from "@/lib/mockData";
import { getPlayerById } from "@/lib/mockData";
import { initializePlayerData } from "@/lib/playerDataUtils";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for loading player profile data - simplified to reduce complexity
 */
export const usePlayerProfile = (playerId: string | undefined) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();

  // Function to load player data, can be called for retries
  const loadPlayerData = useCallback(() => {
    console.log(`[usePlayerProfile] Loading player data for ID: ${playerId}`);
    
    setIsLoading(true);
    setLoadError(null);
    
    if (!playerId) {
      console.error("[usePlayerProfile] No player ID provided");
      setLoadError("No player ID provided.");
      setIsLoading(false);
      return;
    }
    
    // Set a timeout to handle cases where data loading takes too long
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("[usePlayerProfile] Data loading timeout occurred");
        setIsLoading(false);
        setLoadError("Loading timed out. Please try again.");
        toast({
          title: "Loading Timeout",
          description: "Player data took too long to load. Please try again.",
          variant: "destructive",
        });
      }
    }, 5000); // 5 second timeout
    
    try {
      // Direct approach to get player from mockData - no complex caching or storage sync
      let loadedPlayer = getPlayerById(playerId);
      
      if (loadedPlayer) {
        // Initialize player data with all required fields
        const updatedPlayer = initializePlayerData(loadedPlayer);
        console.log("[usePlayerProfile] Player loaded successfully:", updatedPlayer.id, updatedPlayer.name);
        
        setPlayer(updatedPlayer);
        setLoadError(null);
        
        // Actively cache for future use
        try {
          localStorage.setItem(`player_${updatedPlayer.id}`, JSON.stringify(updatedPlayer));
        } catch (cacheError) {
          console.warn("[usePlayerProfile] Could not cache player:", cacheError);
        }
      } else {
        console.error("[usePlayerProfile] Player not found with ID:", playerId);
        setLoadError("Player not found. The player might have been deleted or the ID is incorrect.");
        setPlayer(null);
      }
    } catch (error: any) {
      console.error("[usePlayerProfile] Error loading player:", error);
      setLoadError(`Error loading player data: ${error.message || "Unknown error"}. Please try again.`);
      setPlayer(null);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [playerId, isLoading, toast]);

  // Load player data once on mount or when ID changes
  useEffect(() => {
    loadPlayerData();
  }, [playerId, loadPlayerData]);

  // Function to update player data (e.g., after edits)
  const refreshPlayerData = useCallback(() => {
    console.log("[usePlayerProfile] Refreshing player data");
    loadPlayerData();
  }, [loadPlayerData]);

  return {
    player,
    isLoading,
    loadError,
    loadPlayerData, // For retrying
    refreshPlayerData, // For refreshing after edits
  };
};
