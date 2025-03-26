
import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import PlayerProfileSkeleton from "@/components/player/PlayerProfileSkeleton";
import PlayerProfileError from "@/components/player/PlayerProfileError";
import PlayerProfileContainer from "@/components/player/PlayerProfileContainer";
import { useToast } from "@/components/ui/use-toast";
import { getPlayerById } from "@/lib/mockData";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use the simplified custom hook
  const { 
    player, 
    isLoading, 
    loadError, 
    loadPlayerData, 
    refreshPlayerData 
  } = usePlayerProfile(id);

  // First-run checks
  useEffect(() => {
    console.log("[PlayerProfile] Component mounting, player ID:", id);
    
    // Check if ID exists in the URL
    if (!id) {
      console.error("[PlayerProfile] No player ID in URL parameters");
      toast({
        title: "Missing Information",
        description: "No player ID was provided. Redirecting to players list.",
        variant: "destructive",
      });
      navigate("/players");
    }
    
    // Verify the player ID exists
    try {
      const checkPlayer = getPlayerById(id);
      if (!checkPlayer) {
        console.error("[PlayerProfile] Player ID not found in database:", id);
      }
    } catch (error) {
      console.warn("[PlayerProfile] Error checking player existence:", error);
    }
  }, [id, navigate, toast]);

  const handleBackClick = () => {
    navigate("/players");
  };

  const handleRetry = () => {
    console.log("[PlayerProfile] Manual retry initiated by user");
    loadPlayerData();
    
    toast({
      title: "Retrying",
      description: "Attempting to load player data again...",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
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
