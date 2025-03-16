
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
  Legend,
} from "recharts";

interface RatingChartProps {
  player: Player;
  height?: number;
  showLichessComparison?: boolean;
}

const RatingChart = ({ player, height = 300, showLichessComparison = false }: RatingChartProps) => {
  // Format data for the chart
  const data = useMemo(() => {
    const history = [...player.ratingHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return history.map(item => ({
      date: item.date,
      rating: item.rating,
      // If we have Lichess data, include it
      lichessRating: item.lichessRating || null,
      reason: item.reason
    }));
  }, [player.ratingHistory]);

  const minRating = useMemo(() => {
    // Find the minimum rating across all data points
    const ratings = data.map(d => d.rating);
    if (showLichessComparison) {
      const lichessRatings = data
        .filter(d => d.lichessRating !== null)
        .map(d => d.lichessRating as number);
      
      if (lichessRatings.length > 0) {
        ratings.push(...lichessRatings);
      }
    }
    
    const min = Math.min(...ratings);
    // Round down to nearest 50
    return Math.floor(min / 50) * 50;
  }, [data, showLichessComparison]);

  const maxRating = useMemo(() => {
    // Find the maximum rating across all data points
    const ratings = data.map(d => d.rating);
    if (showLichessComparison) {
      const lichessRatings = data
        .filter(d => d.lichessRating !== null)
        .map(d => d.lichessRating as number);
      
      if (lichessRatings.length > 0) {
        ratings.push(...lichessRatings);
      }
    }
    
    const max = Math.max(...ratings);
    // Round up to nearest 50
    return Math.ceil(max / 50) * 50;
  }, [data, showLichessComparison]);

  // Format the date for display
  const formatXAxis = (tickItem: string) => {
    const [year, month] = tickItem.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Custom tooltip to show reason for rating change
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = data.find(d => d.date === label);
      
      return (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-200 dark:border-gray-700 rounded shadow-md">
          <p className="font-medium">{formatXAxis(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`rating-${index}`} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
          {dataPoint?.reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {dataPoint.reason}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Rating History</h3>
      <div className="w-full" style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tickFormatter={formatXAxis}
              stroke="#9ca3af"
            />
            <YAxis 
              domain={[minRating, maxRating]} 
              stroke="#9ca3af"
            />
            {showLichessComparison && <Legend />}
            <Tooltip content={<CustomTooltip />} />
            
            {/* Nigerian Rating line */}
            <Line 
              type="monotone" 
              dataKey="rating" 
              name="NCR Rating"
              stroke="#D4AF37" 
              strokeWidth={2}
              dot={{ stroke: '#D4AF37', strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ stroke: '#D4AF37', strokeWidth: 2, r: 6, fill: '#D4AF37' }}
            />
            
            {/* Lichess Rating line (if comparison enabled) */}
            {showLichessComparison && (
              <Line 
                type="monotone" 
                dataKey="lichessRating" 
                name="Lichess Rating"
                stroke="#3689fe" 
                strokeWidth={2}
                dot={{ stroke: '#3689fe', strokeWidth: 2, r: 4, fill: 'white' }}
                activeDot={{ stroke: '#3689fe', strokeWidth: 2, r: 6, fill: '#3689fe' }}
              />
            )}
            
            {/* Reference line for floor rating */}
            <ReferenceLine 
              y={800} 
              label="Floor Rating" 
              stroke="#ef4444" 
              strokeDasharray="3 3" 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RatingChart;
