
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tournament, getAllPlayers, Player } from "@/lib/mockData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface ProcessedTournamentDetailsProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProcessedTournamentDetails = ({ 
  tournament, 
  isOpen, 
  onOpenChange 
}: ProcessedTournamentDetailsProps) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (tournament && isOpen) {
      // Fetch all players
      const allPlayers = getAllPlayers();
      
      // Filter players who participated in this tournament
      const tournamentPlayerIds = tournament.processedPlayerIds || [];
      const tournamentPlayers = allPlayers.filter(player => 
        tournamentPlayerIds.includes(player.id)
      );
      
      setPlayers(tournamentPlayers);
      setLoading(false);
    }
  }, [tournament, isOpen]);
  
  if (!tournament) return null;
  
  // Find player rating change for this tournament
  const getPlayerRatingChange = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return 0;
    
    const tournamentResult = player.tournamentResults.find(
      result => result.tournamentId === tournament.id
    );
    
    return tournamentResult?.ratingChange || 0;
  };
  
  // Get player's position in tournament
  const getPlayerPosition = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return "-";
    
    const tournamentResult = player.tournamentResults.find(
      result => result.tournamentId === tournament.id
    );
    
    return tournamentResult?.position || "-";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{tournament.name} - Results</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="standings" className="mt-4">
          <TabsList>
            <TabsTrigger value="standings">Final Standings</TabsTrigger>
            <TabsTrigger value="details">Tournament Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standings" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Final Standings</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Position</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Rating Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players
                        .sort((a, b) => {
                          const posA = Number(getPlayerPosition(a.id)) || 999;
                          const posB = Number(getPlayerPosition(b.id)) || 999;
                          return posA - posB;
                        })
                        .map(player => {
                          const ratingChange = getPlayerRatingChange(player.id);
                          
                          return (
                            <TableRow key={player.id}>
                              <TableCell>{getPlayerPosition(player.id)}</TableCell>
                              <TableCell>
                                <div className="font-medium">
                                  {player.title && (
                                    <span className="text-gold-dark dark:text-gold-light mr-1">
                                      {player.title}
                                    </span>
                                  )}
                                  {player.name}
                                </div>
                              </TableCell>
                              <TableCell>{player.rating}</TableCell>
                              <TableCell>
                                {ratingChange !== 0 ? (
                                  <Badge className={`flex items-center gap-1 ${
                                    ratingChange > 0 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                  }`}>
                                    {ratingChange > 0 ? (
                                      <ArrowUp className="h-3 w-3" />
                                    ) : ratingChange < 0 ? (
                                      <ArrowDown className="h-3 w-3" />
                                    ) : (
                                      <Minus className="h-3 w-3" />
                                    )}
                                    {Math.abs(ratingChange)}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                                    <Minus className="h-3 w-3 mr-1" />
                                    0
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Dates</h3>
                    <p>{new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Location</h3>
                    <p>{tournament.location}, {tournament.city}, {tournament.state}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Control</h3>
                    <p>{tournament.timeControl}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rounds</h3>
                    <p>{tournament.rounds}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Processed On</h3>
                    <p>{tournament.processingDate ? new Date(tournament.processingDate).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Participants</h3>
                    <p>{players.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProcessedTournamentDetails;
