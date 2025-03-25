
import React from "react";
import { useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { usePlayerProfile } from "@/hooks/usePlayerProfile";
import PlayerStorageInitializer from "@/components/player/PlayerStorageInitializer";
import PlayerProfileSkeleton from "@/components/player/PlayerProfileSkeleton";
import PlayerProfileError from "@/components/player/PlayerProfileError";
import PlayerProfileContainer from "@/components/player/PlayerProfileContainer";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { 
    player, 
    isLoading, 
    loadError, 
    loadPlayerData, 
    refreshPlayerData 
  } = usePlayerProfile(id);

  // Initialize storage listeners
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <PlayerStorageInitializer />
      
      {isLoading ? (
        <PlayerProfileSkeleton onBackClick={() => window.history.back()} />
      ) : loadError || !player ? (
        <PlayerProfileError 
          error={loadError} 
          onBackClick={() => window.history.back()} 
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
