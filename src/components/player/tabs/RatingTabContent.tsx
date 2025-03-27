
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Info } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";
import { TournamentResult } from "@/lib/mockData";
import { FLOOR_RATING } from "@/lib/ratingCalculation";

interface RatingTabContentProps {
  format: "classical" | "rapid" | "blitz";
  currentRating: number;
  statusLabel: string;
  gameCount: number;
  history: Array<{ date: string; rating: number }>;
  ratingChanges: Array<{ date: string; rating: number; change: number; reason: string }>;
  tournamentResults: TournamentResult[];
}

const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (e) {
    return dateString;
  }
};

const RatingTabContent: React.FC<RatingTabContentProps> = ({
  format,
  currentRating,
  statusLabel,
  gameCount,
  history,
  ratingChanges,
  tournamentResults
}) => {
  const formatLabel = format.charAt(0).toUpperCase() + format.slice(1);
  const isEstablished = gameCount >= 30;
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {formatLabel} Rating
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 ml-2 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>K-factor is determined by rating level and games played.</p>
                    <p>Players become established after 30 games.</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold">{currentRating}</div>
              <div>
                <Badge variant={isEstablished ? "default" : "outline"}>
                  {isEstablished ? "Established" : "Provisional"}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">
                  {gameCount} games played
                  {!isEstablished && (
                    <span className="block text-xs">
                      {30 - gameCount} more until established
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {history.length > 1 && (
              <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis 
                      dataKey="date" 
                      angle={-45} 
                      textAnchor="end" 
                      height={60}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      domain={[(dataMin: number) => Math.max(FLOOR_RATING - 100, dataMin - 100), (dataMax: number) => dataMax + 100]} 
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip formatter={(value) => [`${value} points`, 'Rating']} />
                    <ReferenceLine y={FLOOR_RATING} stroke="#FF7E67" strokeDasharray="3 3" label={{ value: 'Floor Rating', position: 'insideTopRight', fill: '#FF7E67' }} />
                    <Line 
                      type="monotone" 
                      dataKey="rating" 
                      stroke="#10B981" 
                      strokeWidth={2} 
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Recent Rating Changes</CardTitle>
          </CardHeader>
          <CardContent>
            {ratingChanges.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead className="w-full">Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingChanges.slice(0, 5).map((change, index) => (
                      <TableRow key={index}>
                        <TableCell>{formatDate(change.date)}</TableCell>
                        <TableCell>{change.rating}</TableCell>
                        <TableCell className={
                          change.change > 0 
                            ? "text-green-600" 
                            : change.change < 0 
                              ? "text-red-600" 
                              : ""
                        }>
                          {change.change > 0 && '+'}
                          {change.change}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">{change.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No rating changes recorded for this format.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{formatLabel} Tournament History</CardTitle>
        </CardHeader>
        <CardContent>
          {tournamentResults.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Rating Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tournamentResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{result.tournamentName || "Tournament"}</TableCell>
                      <TableCell>{result.date ? formatDate(result.date) : "No date"}</TableCell>
                      <TableCell>{result.score || "N/A"}/{result.gamesPlayed || "N/A"}</TableCell>
                      <TableCell className={
                        result.ratingChange > 0 
                          ? "text-green-600" 
                          : result.ratingChange < 0 
                            ? "text-red-600" 
                            : ""
                      }>
                        {result.ratingChange > 0 && '+'}
                        {result.ratingChange}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No tournament history found for this player in {format} format.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default RatingTabContent;
