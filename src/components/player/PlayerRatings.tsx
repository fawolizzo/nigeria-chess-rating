
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/mockData";
import { getKFactor } from "@/lib/ratingCalculation";

interface PlayerRatingsProps {
  player: Player;
}

const PlayerRatings: React.FC<PlayerRatingsProps> = ({ player }) => {
  // Get K-factor for classical rating
  const classicalKFactor = getKFactor(player.rating, player.gamesPlayed || 0);
  
  // Set default values for rapid and blitz if not available
  const rapidRating = player.rapidRating || "Not rated";
  const blitzRating = player.blitzRating || "Not rated";
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-md">
            <div className="text-lg font-semibold">Classical</div>
            <div className="text-3xl font-bold mt-1">{player.rating}</div>
            <div className="text-sm text-gray-500 mt-1">K-factor: {classicalKFactor}</div>
            <div className="text-sm text-gray-500">
              {player.gamesPlayed && player.gamesPlayed < 30 ? 
                `${30 - player.gamesPlayed} more games until established` : 
                "Established rating"}
            </div>
          </div>
          
          <div className="p-4 border rounded-md">
            <div className="text-lg font-semibold">Rapid</div>
            <div className="text-3xl font-bold mt-1">{rapidRating}</div>
            {player.rapidRating && (
              <div className="text-sm text-gray-500 mt-1">
                K-factor: {getKFactor(player.rapidRating, player.gamesPlayed || 0)}
              </div>
            )}
          </div>
          
          <div className="p-4 border rounded-md">
            <div className="text-lg font-semibold">Blitz</div>
            <div className="text-3xl font-bold mt-1">{blitzRating}</div>
            {player.blitzRating && (
              <div className="text-sm text-gray-500 mt-1">
                K-factor: {getKFactor(player.blitzRating, player.gamesPlayed || 0)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerRatings;
