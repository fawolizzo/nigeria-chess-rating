
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlayerById } from "@/lib/mockData";
import Navbar from "@/components/Navbar";
import { Player } from "@/lib/mockData";
import PlayerProfileContent from "@/components/player/PlayerProfileContent";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const loadedPlayer = getPlayerById(id);
      if (loadedPlayer) {
        setPlayer(loadedPlayer);
      } else {
        navigate("/players");
      }
    } else {
      navigate("/players");
    }
    setIsLoading(false);
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded mb-4"></div>
          <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!player) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-purple-300">
            {player.name.charAt(0)}
          </div>
          
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {player.title && (
                <span className="text-gold-dark dark:text-gold-light">{player.title}</span>
              )}
              {player.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Rating: {player.rating} • {player.country || "Nigeria"}
            </p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <PlayerProfileContent player={player} />
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
