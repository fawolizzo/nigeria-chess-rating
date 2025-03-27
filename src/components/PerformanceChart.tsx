
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Player } from "@/lib/mockData";
import { FLOOR_RATING } from "@/lib/ratingCalculation";

interface PerformanceChartProps {
  player: Player;
  className?: string;
  ratingType?: 'classical' | 'rapid' | 'blitz';
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  player, 
  className,
  ratingType = 'classical'
}) => {
  // Get the appropriate rating history based on rating type
  const getRatingHistory = () => {
    if (ratingType === 'rapid') {
      return player.rapidRatingHistory || [];
    } else if (ratingType === 'blitz') {
      return player.blitzRatingHistory || [];
    }
    return player.ratingHistory;
  };
  
  // Get the current rating based on rating type
  const getCurrentRating = () => {
    if (ratingType === 'rapid') {
      return player.rapidRating ?? FLOOR_RATING;
    } else if (ratingType === 'blitz') {
      return player.blitzRating ?? FLOOR_RATING;
    }
    return player.rating;
  };
  
  // Get the games played based on rating type
  const getGamesPlayed = () => {
    if (ratingType === 'rapid') {
      return player.rapidGamesPlayed ?? 0;
    } else if (ratingType === 'blitz') {
      return player.blitzGamesPlayed ?? 0;
    }
    return player.gamesPlayed || 0;
  };
  
  // Get the rating status based on rating type and games played
  const getRatingStatus = () => {
    const gamesPlayed = getGamesPlayed();
    if (gamesPlayed >= 30) {
      return 'established';
    }
    return 'provisional';
  };
  
  // Transform rating history for chart display
  const ratingHistory = getRatingHistory();
  const chartData = ratingHistory.map(entry => ({
    date: entry.date,
    rating: entry.rating,
    event: entry.reason || "",
  }));

  // Calculate statistics
  const currentRating = getCurrentRating();
  const initialRating = chartData.length > 0 ? chartData[0].rating : currentRating;
  const highestRating = chartData.length > 0 ? Math.max(...chartData.map(d => d.rating)) : currentRating;
  const lowestRating = chartData.length > 0 ? Math.min(...chartData.map(d => d.rating)) : currentRating;
  const netChange = currentRating - initialRating;
  
  // Calculate appropriate domain padding
  const minRating = Math.max(Math.floor((lowestRating - 50) / 100) * 100, FLOOR_RATING); // Never go below floor rating
  const maxRating = Math.ceil((highestRating + 50) / 100) * 100;

  // Get K-factor description based on rating and games played
  const getKFactorDescription = (rating: number, gamesPlayed: number = 0) => {
    if (gamesPlayed < 30) return "K=40 (New player)";
    if (rating < 2100) return "K=32";
    if (rating < 2400) return "K=24";
    return "K=16";
  };

  // Get rating type display name
  const getRatingTypeDisplay = () => {
    if (ratingType === 'rapid') {
      return "Rapid Rating";
    } else if (ratingType === 'blitz') {
      return "Blitz Rating";
    }
    return "Classical Rating";
  };

  // Calculate displayed games played
  const displayedGamesPlayed = getGamesPlayed();
  const ratingStatus = getRatingStatus();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{getRatingTypeDisplay()}</span>
          <span className="text-lg font-bold">{currentRating}</span>
        </CardTitle>
        <CardDescription>
          K-factor: {getKFactorDescription(currentRating, displayedGamesPlayed)}
          {displayedGamesPlayed < 30 && (
            <span className="block text-xs text-muted-foreground mt-1">
              {30 - displayedGamesPlayed} more games until established
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 1 ? (
          <>
            <div className="flex justify-between mb-4 text-sm">
              <div>
                <div className="font-semibold">Net Change</div>
                <div className={netChange >= 0 ? "text-green-500" : "text-red-500"}>
                  {netChange > 0 ? "+" : ""}{netChange}
                </div>
              </div>
              <div>
                <div className="font-semibold">Highest</div>
                <div>{highestRating}</div>
              </div>
              <div>
                <div className="font-semibold">Lowest</div>
                <div>{lowestRating}</div>
              </div>
              <div>
                <div className="font-semibold">Games</div>
                <div>{displayedGamesPlayed}</div>
              </div>
            </div>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    domain={[minRating, maxRating]} 
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value}`, 'Rating']}
                    labelFormatter={(label) => {
                      const dataPoint = chartData.find(d => d.date === label);
                      return `${label}${dataPoint?.event ? ` - ${dataPoint.event}` : ''}`;
                    }}
                  />
                  <ReferenceLine y={FLOOR_RATING} stroke="#FF5733" strokeDasharray="3 3" label={{ value: 'Floor Rating', position: 'insideBottomRight' }} />
                  <Line 
                    type="monotone" 
                    dataKey="rating" 
                    stroke="#8b5cf6" 
                    strokeWidth={2} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-72 text-gray-500">
            {currentRating === FLOOR_RATING && ratingHistory.length <= 1 
              ? `No ${ratingType} rating history yet. Starting at floor rating ${FLOOR_RATING}.`
              : `Insufficient ${ratingType} rating history data to display chart`
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
