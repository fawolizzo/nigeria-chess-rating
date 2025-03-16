
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Player } from "@/lib/mockData";
import { getKFactor } from "@/lib/ratingCalculation";
import { ExternalLink } from "lucide-react";

interface PlayerRatingsProps {
  player: Player;
}

const PlayerRatings: React.FC<PlayerRatingsProps> = ({ player }) => {
  // Get K-factor for classical rating
  const classicalKFactor = getKFactor(player.rating, player.gamesPlayed || 0);
  
  // Set default values for rapid and blitz if not available
  const rapidRating = player.rapidRating || "Not rated";
  const blitzRating = player.blitzRating || "Not rated";
  
  // Check if player has a Lichess account linked
  const hasLichessLink = Boolean(player.lichessId || player.lichessUrl);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Player Ratings</span>
          {hasLichessLink && (
            <a 
              href={player.lichessUrl || `https://lichess.org/@/${player.lichessId}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm flex items-center text-blue-500 hover:text-blue-600 transition-colors"
            >
              Lichess Profile <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          )}
        </CardTitle>
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
        
        {hasLichessLink && (
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-md text-sm">
            <p>This player's profile is linked to their Lichess account. Rating changes on Lichess may be imported during the next synchronization.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerRatings;
