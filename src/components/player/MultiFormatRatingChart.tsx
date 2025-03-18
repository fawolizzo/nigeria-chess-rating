
import { useMemo } from "react";
import { Player } from "@/lib/mockData";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FLOOR_RATING } from "@/lib/ratingCalculation";

interface MultiFormatRatingChartProps {
  player: Player;
  height?: number;
}

type RatingRecord = {
  date: string;
  classical?: number;
  rapid?: number;
  blitz?: number;
  reason?: string;
};

const MultiFormatRatingChart = ({ player, height = 350 }: MultiFormatRatingChartProps) => {
  // Process the data for the multi-format chart
  const chartData = useMemo(() => {
    // Get all the dates from all rating histories
    const allDates = new Set<string>();
    
    // Add classical rating dates
    player.ratingHistory.forEach(item => {
      allDates.add(item.date);
    });
    
    // Add rapid rating dates if they exist
    if (player.rapidRatingHistory) {
      player.rapidRatingHistory.forEach(item => {
        allDates.add(item.date);
      });
    }
    
    // Add blitz rating dates if they exist
    if (player.blitzRatingHistory) {
      player.blitzRatingHistory.forEach(item => {
        allDates.add(item.date);
      });
    }
    
    // Sort all dates chronologically
    const sortedDates = Array.from(allDates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    
    // Create a map of classical ratings by date
    const classicalRatings = new Map<string, number>();
    player.ratingHistory.forEach(item => {
      classicalRatings.set(item.date, item.rating);
    });
    
    // Create a map of rapid ratings by date (if they exist)
    const rapidRatings = new Map<string, number>();
    if (player.rapidRatingHistory) {
      player.rapidRatingHistory.forEach(item => {
        rapidRatings.set(item.date, item.rating);
      });
    }
    
    // Create a map of blitz ratings by date (if they exist)
    const blitzRatings = new Map<string, number>();
    if (player.blitzRatingHistory) {
      player.blitzRatingHistory.forEach(item => {
        blitzRatings.set(item.date, item.rating);
      });
    }
    
    // Create the dataset with all ratings for each date
    const result: RatingRecord[] = [];
    
    // Process each date and track the most recent rating for each format
    let latestClassical = player.rating;
    let latestRapid = player.rapidRating;
    let latestBlitz = player.blitzRating;
    
    sortedDates.forEach(date => {
      // If we have a new classical rating for this date, update the latest
      if (classicalRatings.has(date)) {
        latestClassical = classicalRatings.get(date)!;
      }
      
      // If we have a new rapid rating for this date, update the latest
      if (rapidRatings.has(date)) {
        latestRapid = rapidRatings.get(date)!;
      }
      
      // If we have a new blitz rating for this date, update the latest
      if (blitzRatings.has(date)) {
        latestBlitz = blitzRatings.get(date)!;
      }
      
      // Find the reason for this rating change (from any history)
      const classicalEntry = player.ratingHistory.find(r => r.date === date);
      const rapidEntry = player.rapidRatingHistory?.find(r => r.date === date);
      const blitzEntry = player.blitzRatingHistory?.find(r => r.date === date);
      
      const reason = classicalEntry?.reason || rapidEntry?.reason || blitzEntry?.reason;
      
      // Add the record for this date with all formats
      result.push({
        date,
        classical: latestClassical,
        rapid: latestRapid,
        blitz: latestBlitz,
        reason
      });
    });
    
    return result;
  }, [player]);

  // Calculate min and max ratings for axis scaling
  const yDomain = useMemo(() => {
    const allRatings: number[] = [];
    
    chartData.forEach(item => {
      if (item.classical) allRatings.push(item.classical);
      if (item.rapid) allRatings.push(item.rapid);
      if (item.blitz) allRatings.push(item.blitz);
    });
    
    const min = Math.min(...allRatings, FLOOR_RATING);
    const max = Math.max(...allRatings);
    
    // Round down the min to nearest 50
    const minRounded = Math.max(Math.floor(min / 50) * 50, FLOOR_RATING - 100);
    // Round up the max to nearest 50
    const maxRounded = Math.ceil(max / 50) * 50 + 50;
    
    return [minRounded, maxRounded];
  }, [chartData]);

  // Format the date for display
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Custom tooltip to show details
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = chartData.find(d => d.date === label);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium">{formatXAxis(label)}</p>
          <div className="space-y-1.5 mt-2">
            {payload.map((entry: any, index: number) => (
              <div key={`rating-${index}`} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <span className="text-sm">
                  {entry.name}: <span className="font-medium">{entry.value}</span>
                </span>
              </div>
            ))}
          </div>
          {dataPoint?.reason && (
            <div className="mt-2 pt-1.5 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dataPoint.reason}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Check if player has any ratings beyond classical
  const hasMultipleRatings = player.rapidRatingHistory?.length || player.blitzRatingHistory?.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Rating History</span>
          {!hasMultipleRatings && (
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
              Classical rating only
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
              />
              <YAxis 
                domain={yDomain} 
                stroke="#9ca3af"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Classical rating line */}
              <Line 
                type="monotone" 
                dataKey="classical" 
                name="Classical"
                stroke="#D4AF37" 
                strokeWidth={2}
                dot={{ stroke: '#D4AF37', strokeWidth: 2, r: 3, fill: 'white' }}
                activeDot={{ stroke: '#D4AF37', strokeWidth: 2, r: 5, fill: '#D4AF37' }}
                connectNulls={true}
              />
              
              {/* Rapid rating line - if available */}
              {player.rapidRatingHistory && player.rapidRatingHistory.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="rapid" 
                  name="Rapid"
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  dot={{ stroke: '#38bdf8', strokeWidth: 2, r: 3, fill: 'white' }}
                  activeDot={{ stroke: '#38bdf8', strokeWidth: 2, r: 5, fill: '#38bdf8' }}
                  connectNulls={true}
                />
              )}
              
              {/* Blitz rating line - if available */}
              {player.blitzRatingHistory && player.blitzRatingHistory.length > 0 && (
                <Line 
                  type="monotone" 
                  dataKey="blitz" 
                  name="Blitz"
                  stroke="#fb7185" 
                  strokeWidth={2}
                  dot={{ stroke: '#fb7185', strokeWidth: 2, r: 3, fill: 'white' }}
                  activeDot={{ stroke: '#fb7185', strokeWidth: 2, r: 5, fill: '#fb7185' }}
                  connectNulls={true}
                />
              )}
              
              {/* Reference line for floor rating */}
              <ReferenceLine 
                y={FLOOR_RATING} 
                label={{ value: "Floor Rating", position: "insideBottomRight" }}
                stroke="#ef4444" 
                strokeDasharray="3 3" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="text-xs text-gray-500 mt-4 px-1">
          <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
            Nigerian Chess Rating System Rules:
          </h4>
          <ul className="list-disc list-outside ml-4 space-y-1">
            <li>Floor rating of {FLOOR_RATING} for new players in any format</li>
            <li>Ratings are tracked separately for each format (Classical, Rapid, Blitz)</li>
            <li>Players with +100 rating suffix are treated as having 30+ games</li>
            <li>Variable K-factors based on rating and experience:</li>
            <ul className="list-disc list-outside ml-6 mt-1">
              <li>K=40 for new players (less than 10 games) under 2000 rating</li>
              <li>K=32 for players rated below 2100</li>
              <li>K=24 for players rated 2100-2399</li>
              <li>K=16 for higher-rated players (2400+)</li>
            </ul>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default MultiFormatRatingChart;
