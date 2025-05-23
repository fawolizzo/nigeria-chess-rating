
import { useState, useEffect } from "react";
import { Player } from "@/lib/mockData";
import { getPlayerById } from "@/services/mockServices";

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
        
        const fetchedPlayer = await getPlayerById(playerId);
        setPlayer(fetchedPlayer);
        
        if (!fetchedPlayer) {
          setError("Player not found");
        }
      } catch (err) {
        console.error("Error fetching player:", err);
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
