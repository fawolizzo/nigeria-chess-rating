
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Player, Tournament, updatePlayer, updateTournament, getPlayersByTournamentId, getAllPlayers } from "@/lib/mockData";
import { calculatePostRoundRatings } from "@/lib/ratingCalculation";

interface TournamentRatingDialogProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessed: () => void;
}

const TournamentRatingDialog = ({ 
  tournament, 
  isOpen, 
  onOpenChange,
  onProcessed
}: TournamentRatingDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!tournament) return null;

  const processRatings = async () => {
    setIsProcessing(true);
    
    try {
      // Get all players to ensure we have a complete dataset
      const allPlayers = getAllPlayers();
      
      // Process each round of matches if tournament has pairings
      if (tournament.pairings && tournament.pairings.length > 0) {
        // Track all players that participated in the tournament
        const participantIds: Record<string, boolean> = {};
        
        // Process each round and calculate rating changes
        const processedRounds = tournament.pairings.map(round => {
          // For each match in the round, calculate rating changes
          const processedMatches = calculatePostRoundRatings(
            round.matches.map(match => {
              // Add players to participants
              participantIds[match.whiteId] = true;
              participantIds[match.blackId] = true;
              
              // Find players
              let whitePlayer = allPlayers.find(p => p.id === match.whiteId);
              let blackPlayer = allPlayers.find(p => p.id === match.blackId);
              
              if (!whitePlayer || !blackPlayer) {
                console.error(`Player not found: ${match.whiteId} or ${match.blackId}`);
                throw new Error(`Player not found: ${match.whiteId} or ${match.blackId}. Please ensure all players exist in the system.`);
              }
              
              return {
                ...match,
                whiteRating: whitePlayer.rating,
                blackRating: blackPlayer.rating,
                whiteGamesPlayed: whitePlayer.gamesPlayed || 0,
                blackGamesPlayed: blackPlayer.gamesPlayed || 0,
                result: (match.result || "*") as "1-0" | "0-1" | "1/2-1/2" | "*"
              };
            })
          );
          
          return {
            roundNumber: round.roundNumber,
            matches: processedMatches
          };
        });
        
        // Calculate player rating changes
        const playerUpdates: Record<string, { 
          ratingChange: number
        }> = {};
        
        processedRounds.forEach(round => {
          round.matches.forEach(match => {
            if (match.result !== "*") {
              // Track white player updates
              if (!playerUpdates[match.whiteId]) {
                playerUpdates[match.whiteId] = { ratingChange: 0 };
              }
              
              // Track black player updates
              if (!playerUpdates[match.blackId]) {
                playerUpdates[match.blackId] = { ratingChange: 0 };
              }
              
              // Add rating changes
              playerUpdates[match.whiteId].ratingChange += match.whiteRatingChange || 0;
              playerUpdates[match.blackId].ratingChange += match.blackRatingChange || 0;
            }
          });
        });
        
        // Apply updates to players
        Object.entries(playerUpdates).forEach(([playerId, update]) => {
          const player = allPlayers.find(p => p.id === playerId);
          if (player) {
            // Calculate final position based on score
            const finalPosition = calculatePlayerPosition(playerId, processedRounds);
            
            // Get the new rating value after the change
            const newRating = player.rating + update.ratingChange;
            
            const updatedPlayer = {
              ...player,
              rating: newRating,
              gamesPlayed: (player.gamesPlayed || 0) + 1,
              ratingHistory: [
                ...(player.ratingHistory || []),
                {
                  date: new Date().toISOString().split('T')[0],
                  rating: newRating,
                  reason: `Tournament: ${tournament.name}`
                }
              ],
              // Update tournament results to include this tournament
              tournamentResults: [
                ...player.tournamentResults.filter(tr => tr.tournamentId !== tournament.id),
                {
                  tournamentId: tournament.id,
                  position: finalPosition,
                  ratingChange: update.ratingChange
                }
              ]
            };
            
            // Update player in system
            updatePlayer(updatedPlayer);
          }
        });
        
        // Mark tournament as processed and store the processing details
        const updatedTournament = {
          ...tournament,
          status: 'processed' as Tournament['status'],
          processingDate: new Date().toISOString(),
          processedPlayerIds: Object.keys(participantIds)
        };
        updateTournament(updatedTournament);
        
        toast({
          title: "Ratings Processed",
          description: `All player ratings have been updated for ${tournament.name}`,
        });
        
        onOpenChange(false);
        onProcessed();
      }
    } catch (error) {
      console.error("Error processing ratings:", error);
      
      toast({
        title: "Error Processing Ratings",
        description: error instanceof Error ? error.message : "An error occurred while processing the ratings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to calculate a player's position in the tournament
  const calculatePlayerPosition = (playerId: string, processedRounds: any[]): number => {
    // Calculate total score for each player
    const playerScores: Record<string, number> = {};
    
    processedRounds.forEach(round => {
      round.matches.forEach((match: any) => {
        // Initialize player scores if not already done
        if (!playerScores[match.whiteId]) {
          playerScores[match.whiteId] = 0;
        }
        if (!playerScores[match.blackId]) {
          playerScores[match.blackId] = 0;
        }
        
        if (match.result === "1-0") {
          playerScores[match.whiteId] += 1;
        } else if (match.result === "0-1") {
          playerScores[match.blackId] += 1;
        } else if (match.result === "1/2-1/2") {
          playerScores[match.whiteId] += 0.5;
          playerScores[match.blackId] += 0.5;
        }
      });
    });
    
    // Convert scores to array and sort by score (descending)
    const sortedPlayers = Object.entries(playerScores)
      .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
      .map(([id]) => id);
    
    // Find position of this player (1-based index)
    const position = sortedPlayers.indexOf(playerId) + 1;
    return position > 0 ? position : sortedPlayers.length; // Default to last if not found
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Tournament Ratings</DialogTitle>
          <DialogDescription>
            This will process the results of {tournament.name} and update all participating players' ratings accordingly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">This action is irreversible</p>
                <p className="text-sm mt-1">
                  Player ratings will be permanently updated based on tournament results.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="font-medium">Rating System Parameters:</div>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>K=40 for new players (less than 10 games) under 2000 rating</li>
                <li>K=32 for players rated below 2100</li>
                <li>K=24 for players rated 2100-2399</li>
                <li>K=16 for higher-rated players (2400+)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={processRatings} 
            disabled={isProcessing}
            className="relative bg-green-600 hover:bg-green-700"
          >
            {isProcessing ? (
              <>
                <span className="opacity-0">Process Ratings</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Process Ratings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRatingDialog;
