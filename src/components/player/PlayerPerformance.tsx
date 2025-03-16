
import React from "react";
import { Player } from "@/lib/mockData";
import PerformanceChart from "@/components/PerformanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKFactor } from "@/lib/ratingCalculation";

interface PlayerPerformanceProps {
  player: Player;
}

const PlayerPerformance: React.FC<PlayerPerformanceProps> = ({ player }) => {
  const kFactor = getKFactor(player.rating, player.gamesPlayed || 0);
  
  // Get rating stats
  const ratingHistory = player.ratingHistory || [];
  const initialRating = ratingHistory.length > 0 ? ratingHistory[0].rating : player.rating;
  const ratingChange = player.rating - initialRating;
  
  // Determine performance trend
  let performanceTrend = "stable";
  if (ratingHistory.length >= 3) {
    const recent = ratingHistory.slice(-3);
    const increases = recent.filter((entry, i) => 
      i > 0 && entry.rating > recent[i-1].rating
    ).length;
    
    const decreases = recent.filter((entry, i) => 
      i > 0 && entry.rating < recent[i-1].rating
    ).length;
    
    if (increases >= 2) performanceTrend = "improving";
    else if (decreases >= 2) performanceTrend = "declining";
  }
  
  return (
    <div className="space-y-6">
      <PerformanceChart player={player} />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Current K-Factor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">K={kFactor}</div>
            <p className="text-sm text-gray-500 mt-1">
              {kFactor === 40 ? "New player" : 
               kFactor === 32 ? "Below 2100" :
               kFactor === 24 ? "2100-2399" : "2400 and above"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Games Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{player.gamesPlayed || ratingHistory.length}</div>
            <p className="text-sm text-gray-500 mt-1">
              {player.gamesPlayed && player.gamesPlayed < 30 ? 
                `${30 - player.gamesPlayed} more until established rating` : 
                "Established rating"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Lifetime Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              ratingChange > 0 ? "text-green-500" : 
              ratingChange < 0 ? "text-red-500" : ""
            }`}>
              {ratingChange > 0 ? "+" : ""}{ratingChange}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {performanceTrend === "improving" ? "Improving trend" : 
               performanceTrend === "declining" ? "Declining trend" : "Stable performance"}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlayerPerformance;
