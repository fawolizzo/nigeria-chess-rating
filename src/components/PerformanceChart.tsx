
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Player } from "@/lib/mockData";

interface PerformanceChartProps {
  player: Player;
  className?: string;
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ player, className }) => {
  // Transform rating history for chart display
  const chartData = player.ratingHistory.map(entry => ({
    date: entry.date,
    rating: entry.rating,
    event: entry.reason || "",
  }));

  // Calculate statistics
  const currentRating = player.rating;
  const initialRating = chartData.length > 0 ? chartData[0].rating : currentRating;
  const highestRating = Math.max(...chartData.map(d => d.rating));
  const lowestRating = Math.min(...chartData.map(d => d.rating));
  const netChange = currentRating - initialRating;
  
  // Calculate appropriate domain padding
  const minRating = Math.max(Math.floor((lowestRating - 50) / 100) * 100, 800); // Never go below floor rating
  const maxRating = Math.ceil((highestRating + 50) / 100) * 100;

  // Adjust games played for display if player has a +100 rating
  const getDisplayedGamesPlayed = () => {
    const hasPlus100 = String(currentRating).endsWith('100');
    const actualGamesPlayed = player.gamesPlayed || 0;
    
    // If player has +100 rating, ensure displayed games count starts at 31
    if (hasPlus100) {
      return Math.max(31, actualGamesPlayed);
    }
    return actualGamesPlayed;
  };

  // Get K-factor description based on rating and games played
  const getKFactorDescription = (rating: number, gamesPlayed: number = 0) => {
    // If rating ends with 100, treat as experienced player
    if (String(rating).endsWith('100')) {
      return "K=32 (Established player)";
    }
    
    if (gamesPlayed < 10) return "K=40 (New player)";
    if (rating < 2100) return "K=32";
    if (rating < 2400) return "K=24";
    return "K=16";
  };

  // Calculate displayed games played
  const displayedGamesPlayed = getDisplayedGamesPlayed();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Rating Performance</span>
          <span className="text-lg font-bold">{currentRating}</span>
        </CardTitle>
        <CardDescription>
          K-factor: {getKFactorDescription(currentRating, player.gamesPlayed || 0)}
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
                  <ReferenceLine y={800} stroke="#FF5733" strokeDasharray="3 3" label={{ value: 'Floor Rating', position: 'insideBottomRight' }} />
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
            Insufficient rating history data to display chart
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PerformanceChart;
