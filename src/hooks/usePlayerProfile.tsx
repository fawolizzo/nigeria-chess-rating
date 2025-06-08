
import { useState, useEffect } from "react";
import { Player } from "@/lib/mockData";
import { getPlayerByIdFromSupabase } from "@/services/playerService";

export const usePlayerProfile = (playerId: string | undefined) => {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayer = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!playerId) {
          setPlayer(null);
          return;
        }
        
        console.log("🔍 Fetching player profile for ID:", playerId);
        const fetchedPlayer = await getPlayerByIdFromSupabase(playerId);
        
        if (fetchedPlayer) {
          console.log("✅ Player profile loaded:", fetchedPlayer.name);
          setPlayer(fetchedPlayer);
        } else {
          console.log("❌ Player not found for ID:", playerId);
          setError("Player not found");
        }
      } catch (err) {
        console.error("💥 Error fetching player:", err);
        setError("Failed to load player data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlayer();
  }, [playerId]);
  
  return { player, loading, error };
};

export default usePlayerProfile;
