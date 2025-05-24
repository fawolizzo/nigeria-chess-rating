
import { useState, useEffect, useCallback } from "react";
import { Player } from "@/lib/mockData";
// import { getPlayerById } from "@/lib/mockData"; // Removed mockData import
import { getPlayerByIdFromSupabase } from "@/services/playerService"; // Added Supabase service import
import { initializePlayerData } from "@/lib/playerDataUtils"; // This util might need review if it assumes mockData structure
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for loading player profile data - simplified to reduce complexity
 */
export const usePlayerProfile = (playerId: string | undefined) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null); // Renamed to error for consistency if preferred
  const { toast } = useToast();

  // Function to load player data, can be called for retries
  const loadPlayerData = useCallback(async () => {
    if (!playerId) {
      console.error("[usePlayerProfile] No player ID provided");
      setLoadError("No player ID provided.");
      setIsLoading(false);
      setPlayer(null);
      return;
    }
    
    console.log(`[usePlayerProfile] Loading player data for ID: ${playerId} from Supabase`);
    setIsLoading(true);
    setLoadError(null);
    
    try {
      const fetchedPlayer = await getPlayerByIdFromSupabase(playerId);
      
      if (fetchedPlayer) {
        // initializePlayerData might still be useful if Supabase doesn't return all optional fields
        // or if some client-side defaults are desired.
        // For now, assuming fetchedPlayer structure matches Player type sufficiently.
        // If initializePlayerData does significant work based on mockData specifics, it needs review.
        // const initializedPlayer = initializePlayerData(fetchedPlayer); 
        // For now, using fetchedPlayer directly or after minimal processing.
        // Explicitly ensure all expected fields are present, especially optional ones for history/results.
        const processedPlayer: Player = {
          ...fetchedPlayer,
          ratingHistory: fetchedPlayer.ratingHistory || [],
          tournamentResults: fetchedPlayer.tournamentResults || [],
          // Ensure other optional array/object fields are initialized if needed by UI
          rapidRatingHistory: fetchedPlayer.rapidRatingHistory || [],
          blitzRatingHistory: fetchedPlayer.blitzRatingHistory || [],
          achievements: fetchedPlayer.achievements || [],
        };

        console.log("[usePlayerProfile] Player loaded successfully from Supabase:", processedPlayer.id, processedPlayer.name);
        setPlayer(processedPlayer);
      } else {
        console.warn("[usePlayerProfile] Player not found with ID via Supabase:", playerId);
        setLoadError("Player not found. The profile may not exist or the ID is incorrect.");
        setPlayer(null);
        // Toast for "not found" was in PlayerProfile.tsx, can be kept there or moved here.
      }
    } catch (err: any) {
      console.error("[usePlayerProfile] Error loading player from Supabase:", err);
      setLoadError(`Failed to load player profile: ${err.message || "An unexpected error occurred."}`);
      setPlayer(null);
      toast({
        title: "Error Loading Profile",
        description: "There was a problem fetching the player data from the server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [playerId, toast]); // Removed isLoading from deps as it causes re-runs

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
