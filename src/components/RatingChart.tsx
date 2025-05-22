
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
} from "recharts";

type RatingHistoryType = 'classical' | 'rapid' | 'blitz';

interface RatingChartProps {
  player: Player;
  historyType?: RatingHistoryType; // New prop to select history type
  height?: number;
}

const RatingChart = ({ player, historyType = 'classical', height = 300 }: RatingChartProps) => {
  // Format data for the chart
  const data = useMemo(() => {
    let sourceHistory;
    switch (historyType) {
      case 'rapid':
        sourceHistory = player.rapidRatingHistory;
        break;
      case 'blitz':
        sourceHistory = player.blitzRatingHistory;
        break;
      case 'classical':
      default:
        sourceHistory = player.ratingHistory;
        break;
    }

    if (!sourceHistory || sourceHistory.length === 0) {
      return [];
    }

    const history = [...sourceHistory].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    return history.map(item => ({
      date: item.date,
      rating: item.rating,
      reason: item.reason // Reason might be optional, ensure it's handled
    }));
  }, [player, historyType]);

  const yAxisDomain = useMemo(() => {
    if (data.length === 0) {
      return [0, 1000]; // Default domain if no data
    }
    const ratings = data.map(d => d.rating);
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    // Round down to nearest 50 for min, up for max
    const roundedMin = Math.floor(min / 50) * 50;
    const roundedMax = Math.ceil(max / 50) * 50;
    return [Math.max(0, roundedMin - 50), roundedMax + 50]; // Ensure min is not negative and add some padding
  }, [data]);


  // Format the date for display
  const formatXAxis = (tickItem: string) => {
    const [year, month] = tickItem.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Custom tooltip to show reason for rating change
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && data.length > 0) {
      // Find the original data point by matching the label (date)
      // This assumes 'label' corresponds to 'date' in the 'data' array
      const dataPoint = data.find(d => d.date === label);

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-300 dark:border-gray-700 rounded shadow-lg">
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{formatXAxis(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`rating-${index}`} style={{ color: entry.stroke }} className="text-sm">
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
          {dataPoint?.reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
              Reason: {dataPoint.reason}
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  const ratingTypeLabel = historyType.charAt(0).toUpperCase() + historyType.slice(1);


  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{ratingTypeLabel} Rating History</h3>
      {data.length === 0 ? (
        <div style={{ height: `${height}px` }} className="flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400">No {historyType} rating history available.</p>
        </div>
      ) : (
        <div className="w-full" style={{ height: `${height}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 5, right: 30, left: 0, bottom: 5 }} // Adjusted left margin for YAxis
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatXAxis}
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={yAxisDomain} 
                stroke="#9ca3af"
                tick={{ fontSize: 12 }}
                allowDataOverflow={true} // Important for when data is outside domain due to rounding
              />
              <Tooltip content={<CustomTooltip />} />
              
              <Line 
                type="monotone" 
                dataKey="rating" 
                name={`${ratingTypeLabel} Rating`}
                stroke="#D4AF37" 
                strokeWidth={2}
                dot={{ stroke: '#D4AF37', strokeWidth: 2, r: 3, fill: '#fff' }}
                activeDot={{ stroke: '#D4AF37', strokeWidth: 2, r: 5, fill: '#D4AF37' }}
              />
              
              {/* Reference line for floor rating */}
              <ReferenceLine 
                y={800} 
                label={{ value: "Floor Rating", position: 'insideTopRight', fill: '#ef4444', fontSize: 10 }} 
                stroke="#ef4444" 
                strokeDasharray="3 3" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default RatingChart;
