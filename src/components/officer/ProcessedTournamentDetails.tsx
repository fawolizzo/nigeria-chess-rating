
import React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Player, Tournament, getPlayerById } from "@/lib/mockData";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, LineChartIcon, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProcessedTournamentDetailsProps {
  tournament: Tournament;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProcessedTournamentDetails: React.FC<ProcessedTournamentDetailsProps> = ({ 
  tournament, 
  isOpen, 
  onOpenChange 
}) => {
  const navigate = useNavigate();
  const processingDate = tournament.processingDate ? new Date(tournament.processingDate) : null;

  // Get players who participated in this tournament
  const players = tournament.players
    ? tournament.players.map(playerId => getPlayerById(playerId)).filter(Boolean) as Player[]
    : [];

  // Sort players by their position in this tournament
  const sortedPlayers = [...players].sort((a, b) => {
    const aResult = a.tournamentResults.find(r => r.tournamentId === tournament.id);
    const bResult = b.tournamentResults.find(r => r.tournamentId === tournament.id);
    
    if (!aResult) return 1;
    if (!bResult) return -1;
    
    return aResult.position - bResult.position;
  });

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processed Tournament Results</CardTitle>
            <CardDescription>
              This tournament was processed {processingDate ? processingDate.toLocaleDateString() : "recently"}
            </CardDescription>
          </div>
          <Badge className="bg-purple-500">Processed</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarIcon size={16} />
            <span>Processed on: {processingDate ? processingDate.toLocaleString() : "N/A"}</span>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Rating Changes</h3>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Position</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Rating Before</TableHead>
                    <TableHead>Rating Change</TableHead>
                    <TableHead>Rating After</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPlayers.length > 0 ? (
                    sortedPlayers.map(player => {
                      const result = player.tournamentResults.find(r => r.tournamentId === tournament.id);
                      if (!result) return null;
                      
                      // Find player's rating before this tournament by looking at rating history
                      const currentRating = player.rating;
                      const ratingChange = result.ratingChange;
                      const previousRating = currentRating - ratingChange;
                      
                      return (
                        <TableRow key={player.id} className="cursor-pointer hover:bg-muted" onClick={() => navigate(`/player/${player.id}`)}>
                          <TableCell>{result.position}</TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-1">
                              {player.title && <span className="text-amber-500">{player.title}</span>}
                              {player.name}
                            </div>
                          </TableCell>
                          <TableCell>{previousRating}</TableCell>
                          <TableCell className={ratingChange >= 0 ? "text-green-500" : "text-red-500"}>
                            {ratingChange > 0 ? "+" : ""}{ratingChange}
                          </TableCell>
                          <TableCell className="font-medium">{currentRating}</TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          <p>No player data available for this tournament or players have been removed</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessedTournamentDetails;
