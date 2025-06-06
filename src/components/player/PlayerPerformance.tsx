import React from "react";
import { Player, TournamentResult } from "@/lib/mockData";
import { getTournamentById } from "@/services/mockServices";
import PerformanceChart from "@/components/PerformanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getKFactor } from "@/lib/ratingCalculation";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PlayerPerformanceProps {
  player: Player;
}

const PlayerPerformance: React.FC<PlayerPerformanceProps> = ({ player }) => {
  const navigate = useNavigate();
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
      
      {/* Tournament Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Results</CardTitle>
        </CardHeader>
        <CardContent>
          {player.tournamentResults.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tournament</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Rating Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {player.tournamentResults.map(result => {
                    const tournament = getTournamentById(result.tournamentId);
                    return (
                      <TableRow 
                        key={result.tournamentId} 
                        className="cursor-pointer hover:bg-muted"
                        onClick={() => navigate(`/tournaments/${result.tournamentId}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Trophy size={16} className="text-amber-500" />
                            {tournament?.name || `Tournament #${result.tournamentId}`}
                          </div>
                          {tournament && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {tournament.startDate} - {tournament.endDate}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{result.position}</TableCell>
                        <TableCell className={result.ratingChange >= 0 ? "text-green-500" : "text-red-500"}>
                          {result.ratingChange > 0 ? "+" : ""}{result.ratingChange}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No tournament results available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayerPerformance;
