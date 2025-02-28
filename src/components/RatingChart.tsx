
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

interface RatingChartProps {
  player: Player;
  height?: number;
}

const RatingChart = ({ player, height = 300 }: RatingChartProps) => {
  const data = useMemo(() => {
    return player.ratingHistory.map(item => ({
      date: item.date,
      rating: item.rating
    }));
  }, [player.ratingHistory]);

  const minRating = useMemo(() => {
    const min = Math.min(...data.map(d => d.rating));
    // Round down to nearest 50
    return Math.floor(min / 50) * 50;
  }, [data]);

  const maxRating = useMemo(() => {
    const max = Math.max(...data.map(d => d.rating));
    // Round up to nearest 50
    return Math.ceil(max / 50) * 50;
  }, [data]);

  // Format the date for display
  const formatXAxis = (tickItem: string) => {
    const [year, month] = tickItem.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                border: '1px solid #e5e7eb',
                borderRadius: '0.375rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              }}
              labelFormatter={formatXAxis}
            />
            <Line 
              type="monotone" 
              dataKey="rating" 
              stroke="#D4AF37" 
              strokeWidth={2}
              dot={{ stroke: '#D4AF37', strokeWidth: 2, r: 4, fill: 'white' }}
              activeDot={{ stroke: '#D4AF37', strokeWidth: 2, r: 6, fill: '#D4AF37' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RatingChart;
