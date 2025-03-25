
import { useState, useEffect, useCallback, useRef } from "react";
import { Player } from "@/lib/mockData";
import { getPlayerById } from "@/lib/mockData";
import { initializePlayerData } from "@/lib/playerDataUtils";
import { 
  syncStorage, 
  forceSyncAllStorage, 
  validatePlayerData,
  getFromStorage,
  safeJSONParse
} from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for loading and managing player profile data with improved
 * reliability, error handling, and fallback mechanisms
 */
export const usePlayerProfile = (playerId: string | undefined) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadAttempts, setLoadAttempts] = useState(0);
  const loadingTimerRef = useRef<number | null>(null);
  const { toast } = useToast();

  // Function to clear any pending timers
  const clearLoadingTimers = useCallback(() => {
    if (loadingTimerRef.current !== null) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  }, []);

  // Function to load player data, can be called for retries
  const loadPlayerData = useCallback(() => {
    console.log(`[usePlayerProfile] Loading player data for ID: ${playerId}, attempt: ${loadAttempts + 1}`);
    
    // Clear any existing timers
    clearLoadingTimers();
    
    setIsLoading(true);
    setLoadError(null);
    setLoadAttempts(prev => prev + 1);
    
    if (!playerId) {
      console.error("[usePlayerProfile] No player ID provided");
      setLoadError("No player ID provided.");
      setIsLoading(false);
      return;
    }
    
    // Force sync all storage to ensure we have the latest data
    forceSyncAllStorage();
    
    // Try to get cached player from session storage first (faster loading)
    const cachedPlayerId = sessionStorage.getItem('last_viewed_player_id');
    const cachedPlayerJSON = sessionStorage.getItem('last_viewed_player');
    
    console.log(`[usePlayerProfile] Checking cache: ID ${cachedPlayerId}, Data exists: ${!!cachedPlayerJSON}`);
    
    // If we have a cached player that matches the requested ID, use it immediately
    // but still load from main storage in the background
    let cachedPlayer: Player | null = null;
    
    if (cachedPlayerId === playerId && cachedPlayerJSON) {
      try {
        cachedPlayer = safeJSONParse(cachedPlayerJSON, null);
        if (cachedPlayer && validatePlayerData(cachedPlayer)) {
          console.log("[usePlayerProfile] Using cached player data:", cachedPlayer.id, cachedPlayer.name);
          
          // Initialize player data with all required fields
          const initializedPlayer = initializePlayerData(cachedPlayer);
          
          // Set player data immediately to improve perceived performance
          setPlayer(initializedPlayer);
          // Continue with regular loading to fetch the latest data from main storage
        } else {
          console.warn("[usePlayerProfile] Cached player data failed validation");
        }
      } catch (error) {
        console.warn("[usePlayerProfile] Error parsing cached player:", error);
        // Continue with regular loading if cache fails
      }
    }
    
    // Add a small delay to ensure data is synchronized
    loadingTimerRef.current = window.setTimeout(() => {
      try {
        // Specifically sync the players data
        syncStorage('ncr_players');
        
        // Try to get player from storage first
        let loadedPlayer: Player | null = null;
        
        try {
          loadedPlayer = getPlayerById(playerId);
          console.log("[usePlayerProfile] Raw loaded player:", loadedPlayer ? "Found" : "Not found", 
            loadedPlayer ? `(ID: ${loadedPlayer.id}, Name: ${loadedPlayer.name})` : "");
        } catch (storageError) {
          console.error("[usePlayerProfile] Error accessing storage:", storageError);
          throw new Error("Could not access player data storage. Please reload the page.");
        }
        
        if (loadedPlayer) {
          // Validate player data
          if (!validatePlayerData(loadedPlayer)) {
            console.error("[usePlayerProfile] Player data validation failed:", loadedPlayer);
            throw new Error("Player data is incomplete or invalid");
          }
          
          // Initialize player data with all required fields
          const updatedPlayer = initializePlayerData(loadedPlayer);
          console.log("[usePlayerProfile] Initialized player:", updatedPlayer.id, updatedPlayer.name);
          
          setPlayer(updatedPlayer);
          setLoadError(null);
          
          // Update session cache with latest data
          try {
            sessionStorage.setItem('last_viewed_player_id', updatedPlayer.id);
            sessionStorage.setItem('last_viewed_player', JSON.stringify(updatedPlayer));
          } catch (cacheError) {
            console.warn("[usePlayerProfile] Could not update cache:", cacheError);
          }
        } else {
          console.error("[usePlayerProfile] Player not found with ID:", playerId);
          
          // If we're using cached data but couldn't find the player in storage,
          // keep using the cached player but show a warning
          if (cachedPlayer) {
            console.log("[usePlayerProfile] Falling back to cached data");
            
            toast({
              title: "Using Cached Data",
              description: "Showing cached player data. Some information may not be current.",
              variant: "warning",
            });
          } else {
            setLoadError("Player not found. The player might have been deleted or the ID is incorrect.");
            setPlayer(null);
            
            toast({
              title: "Player Not Found",
              description: "The player you're looking for doesn't exist or has been removed.",
              variant: "destructive",
            });
          }
        }
      } catch (error: any) {
        console.error("[usePlayerProfile] Error loading player:", error);
        
        if (cachedPlayer) {
          // If we already set a cached player but got an error loading the latest,
          // keep the cached version and show a warning
          toast({
            title: "Data Refresh Failed",
            description: "Using cached data. Could not refresh with latest information.",
            variant: "warning",
          });
        } else {
          setLoadError(`Error loading player data: ${error.message || "Unknown error"}. Please try again.`);
          setPlayer(null);
          
          toast({
            title: "Error Loading Profile",
            description: `${error.message || "An unknown error occurred"}. Please try again.`,
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
        loadingTimerRef.current = null;
      }
    }, 300); // Shorter delay for better responsiveness
    
    return () => {
      if (loadingTimerRef.current !== null) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, [playerId, loadAttempts, toast, clearLoadingTimers]);

  // Load player data after ID changes
  useEffect(() => {
    console.log("[usePlayerProfile] Hook mounting or ID changing, player ID:", playerId);
    loadPlayerData();
    
    // Set up event listeners for storage changes
    const handleStorageChange = () => {
      console.log("[usePlayerProfile] Storage change detected, reloading player data");
      loadPlayerData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearLoadingTimers();
    };
  }, [playerId, loadPlayerData, clearLoadingTimers]);

  // Function to update player data (e.g., after edits)
  const refreshPlayerData = useCallback(() => {
    console.log("[usePlayerProfile] Refreshing player data");
    
    // Force sync and reload player data after successful edit
    forceSyncAllStorage();
    
    if (playerId) {
      try {
        const updatedPlayer = getPlayerById(playerId);
        if (updatedPlayer) {
          const initializedPlayer = initializePlayerData(updatedPlayer);
          setPlayer(initializedPlayer);
          
          // Update session cache
          sessionStorage.setItem('last_viewed_player_id', initializedPlayer.id);
          sessionStorage.setItem('last_viewed_player', JSON.stringify(initializedPlayer));
          
          toast({
            title: "Profile Updated",
            description: "The player profile has been successfully updated.",
          });
        }
      } catch (error: any) {
        console.error("[usePlayerProfile] Error reloading player after edit:", error);
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
