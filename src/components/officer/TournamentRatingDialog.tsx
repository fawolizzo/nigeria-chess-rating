import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle, AlertCircle, BadgeCheck } from "lucide-react";
import { Player, Tournament, updatePlayer, updateTournament, getAllPlayers } from "@/lib/mockData";
import { calculatePostRoundRatings, FLOOR_RATING } from "@/lib/ratingCalculation";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  // Get all registered players for this tournament
  const allPlayers = getAllPlayers();
  
  // First try to get players from the players array in the tournament
  let tournamentPlayers: Player[] = [];
  if (tournament.players && tournament.players.length > 0) {
    tournamentPlayers = tournament.players.map(playerId => {
      const player = allPlayers.find(p => p.id === playerId);
      return player;
    }).filter((player): player is Player => player !== undefined);
  }
  
  // If no players found, try to find players from the pairings
  if (tournamentPlayers.length === 0 && tournament.pairings && tournament.pairings.length > 0) {
    const playerIds = new Set<string>();
    
    // Collect all player IDs from pairings
    tournament.pairings.forEach(round => {
      round.matches.forEach(match => {
        playerIds.add(match.whiteId);
        playerIds.add(match.blackId);
      });
    });
    
    tournamentPlayers = Array.from(playerIds).map(id => {
      const player = allPlayers.find(p => p.id === id);
      return player;
    }).filter((player): player is Player => player !== undefined);
  }
  
  // As a last resort, try the tournament results in player objects
  if (tournamentPlayers.length === 0) {
    tournamentPlayers = allPlayers.filter(player => 
      player.tournamentResults.some(result => result.tournamentId === tournament.id)
    );
  }
  
  // Check if tournament can be processed
  const hasNoPlayers = tournamentPlayers.length === 0;
  const isNotCompleted = tournament.status !== 'completed';
  const cannotProcess = hasNoPlayers || isNotCompleted;

  const processRatings = async () => {
    setIsProcessing(true);
    
    try {
      // Double-check if tournament is in a valid state for processing
      if (cannotProcess) {
        throw new Error(
          hasNoPlayers 
            ? "Cannot process a tournament with no players." 
            : "Only completed tournaments can be processed for ratings."
        );
      }
      
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
              
              // Get the appropriate rating based on tournament category
              const getPlayerRating = (player: Player) => {
                if (tournament.category === 'rapid') {
                  // Use floor rating if player has no rapid rating
                  return player.rapidRating ?? FLOOR_RATING;
                } else if (tournament.category === 'blitz') {
                  // Use floor rating if player has no blitz rating
                  return player.blitzRating ?? FLOOR_RATING;
                }
                return player.rating;
              };
              
              // Helper function to get rating status
              const getPlayerRatingStatus = (player: Player) => {
                if (tournament.category === 'rapid') {
                  return player.rapidRatingStatus || 'provisional';
                } else if (tournament.category === 'blitz') {
                  return player.blitzRatingStatus || 'provisional';
                }
                return player.ratingStatus || 'provisional';
              };
              
              const getPlayerGamesPlayed = (player: Player) => {
                const playerRating = getPlayerRating(player);
                const ratingStatus = getPlayerRatingStatus(player);
                
                if (tournament.category === 'rapid') {
                  // Start at 0 games if player has no rapid rating history
                  const gamesPlayed = player.rapidGamesPlayed ?? 0;
                  return ratingStatus === 'established' ? Math.max(30, gamesPlayed) : gamesPlayed;
                } else if (tournament.category === 'blitz') {
                  // Start at 0 games if player has no blitz rating history
                  const gamesPlayed = player.blitzGamesPlayed ?? 0;
                  return ratingStatus === 'established' ? Math.max(30, gamesPlayed) : gamesPlayed;
                }
                const gamesPlayed = player.gamesPlayed || 0;
                return ratingStatus === 'established' ? Math.max(30, gamesPlayed) : gamesPlayed;
              };
              
              return {
                ...match,
                whiteRating: getPlayerRating(whitePlayer),
                blackRating: getPlayerRating(blackPlayer),
                whiteGamesPlayed: getPlayerGamesPlayed(whitePlayer),
                blackGamesPlayed: getPlayerGamesPlayed(blackPlayer),
                result: (match.result || "*") as "1-0" | "0-1" | "1/2-1/2" | "*" | "1F-0" | "0-1F" | "0F-0F"
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
          ratingChange: number,
          gamesPlayed: number
        }> = {};
        
        processedRounds.forEach(round => {
          round.matches.forEach(match => {
            if (match.result !== "*") {
              // Track white player updates
              if (!playerUpdates[match.whiteId]) {
                playerUpdates[match.whiteId] = { ratingChange: 0, gamesPlayed: 0 };
              }
              
              // Track black player updates
              if (!playerUpdates[match.blackId]) {
                playerUpdates[match.blackId] = { ratingChange: 0, gamesPlayed: 0 };
              }
              
              // Add rating changes
              playerUpdates[match.whiteId].ratingChange += match.whiteRatingChange || 0;
              playerUpdates[match.blackId].ratingChange += match.blackRatingChange || 0;
              
              // Increment games played
              playerUpdates[match.whiteId].gamesPlayed += 1;
              playerUpdates[match.blackId].gamesPlayed += 1;
            }
          });
        });
        
        // Apply updates to players
        Object.entries(playerUpdates).forEach(([playerId, update]) => {
          const player = allPlayers.find(p => p.id === playerId);
          if (player) {
            // Calculate final position based on score
            const finalPosition = calculatePlayerPosition(playerId, processedRounds);
            
            const updatePlayerBasedOnTournamentType = (player: Player) => {
              if (tournament.category === 'rapid') {
                // Update rapid rating
                // If no rapid rating yet, start with floor rating
                const currentRapidRating = player.rapidRating ?? FLOOR_RATING;
                const newRapidRating = currentRapidRating + update.ratingChange;
                
                // Update rapid games played
                const currentRapidGamesPlayed = player.rapidGamesPlayed ?? 0;
                const newRapidGamesPlayed = currentRapidGamesPlayed + update.gamesPlayed;
                
                // Determine if rating status should change
                let newRapidRatingStatus = player.rapidRatingStatus || 'provisional';
                if (newRapidRatingStatus === 'provisional' && newRapidGamesPlayed >= 30) {
                  newRapidRatingStatus = 'established';
                }
                
                return {
                  ...player,
                  rapidRating: newRapidRating,
                  rapidGamesPlayed: newRapidGamesPlayed,
                  rapidRatingStatus: newRapidRatingStatus,
                  rapidRatingHistory: [
                    ...(player.rapidRatingHistory || []),
                    {
                      date: new Date().toISOString().split('T')[0],
                      rating: newRapidRating,
                      reason: `Tournament: ${tournament.name}`
                    }
                  ]
                };
              } else if (tournament.category === 'blitz') {
                // Update blitz rating
                // If no blitz rating yet, start with floor rating
                const currentBlitzRating = player.blitzRating ?? FLOOR_RATING;
                const newBlitzRating = currentBlitzRating + update.ratingChange;
                
                // Update blitz games played
                const currentBlitzGamesPlayed = player.blitzGamesPlayed ?? 0;
                const newBlitzGamesPlayed = currentBlitzGamesPlayed + update.gamesPlayed;
                
                // Determine if rating status should change
                let newBlitzRatingStatus = player.blitzRatingStatus || 'provisional';
                if (newBlitzRatingStatus === 'provisional' && newBlitzGamesPlayed >= 30) {
                  newBlitzRatingStatus = 'established';
                }
                
                return {
                  ...player,
                  blitzRating: newBlitzRating,
                  blitzGamesPlayed: newBlitzGamesPlayed,
                  blitzRatingStatus: newBlitzRatingStatus,
                  blitzRatingHistory: [
                    ...(player.blitzRatingHistory || []),
                    {
                      date: new Date().toISOString().split('T')[0],
                      rating: newBlitzRating,
                      reason: `Tournament: ${tournament.name}`
                    }
                  ]
                };
              } else {
                // Default to classical rating
                const currentRating = player.rating;
                const newRating = currentRating + update.ratingChange;
                
                // Update classical games played
                const currentGamesPlayed = player.gamesPlayed || 0;
                const newGamesPlayed = currentGamesPlayed + update.gamesPlayed;
                
                // Determine if rating status should change
                let newRatingStatus = player.ratingStatus || 'provisional';
                if (newRatingStatus === 'provisional' && newGamesPlayed >= 30) {
                  newRatingStatus = 'established';
                }
                
                return {
                  ...player,
                  rating: newRating,
                  gamesPlayed: newGamesPlayed,
                  ratingStatus: newRatingStatus,
                  ratingHistory: [
                    ...(player.ratingHistory || []),
                    {
                      date: new Date().toISOString().split('T')[0],
                      rating: newRating,
                      reason: `Tournament: ${tournament.name}`
                    }
                  ]
                };
              }
            };
            
            // Update the player with the appropriate rating changes
            const updatedPlayer = updatePlayerBasedOnTournamentType(player);
            
            // Add tournament result
            const updatedPlayerWithResults = {
              ...updatedPlayer,
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
            updatePlayer(updatedPlayerWithResults);
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
        
        if (match.result === "1-0" || match.result === "1F-0") {
          playerScores[match.whiteId] += 1;
        } else if (match.result === "0-1" || match.result === "0-1F") {
          playerScores[match.blackId] += 1;
        } else if (match.result === "1/2-1/2") {
          playerScores[match.whiteId] += 0.5;
          playerScores[match.blackId] += 0.5;
        }
        // Note: 0F-0F (double forfeit) - both players get 0, so no score to add
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

  // Function to get appropriate rating based on tournament type
  const getDisplayRating = (player: Player) => {
    if (tournament.category === 'rapid') {
      return player.rapidRating ?? FLOOR_RATING;
    } else if (tournament.category === 'blitz') {
      return player.blitzRating ?? FLOOR_RATING;
    }
    return player.rating;
  };

  // Function to get the rating status icon
  const getRatingStatusIcon = (player: Player) => {
    let ratingStatus: string | undefined;
    
    if (tournament.category === 'rapid') {
      ratingStatus = player.rapidRatingStatus;
    } else if (tournament.category === 'blitz') {
      ratingStatus = player.blitzRatingStatus;
    } else {
      ratingStatus = player.ratingStatus;
    }
    
    if (ratingStatus === 'established') {
      return <BadgeCheck size={16} className="text-green-600 ml-1" />;
    } else {
      return <AlertCircle size={14} className="text-amber-600 ml-1" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Tournament Ratings</DialogTitle>
          <DialogDescription>
            This will process the results of {tournament.name} and update all participating players' {tournament.category || 'classical'} ratings accordingly.
          </DialogDescription>
        </DialogHeader>
        
        {cannotProcess ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {hasNoPlayers 
                ? "This tournament has no registered players and cannot be processed." 
                : "Only tournaments marked as 'Completed' by the organizer can be processed for ratings."}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-md">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">This action is irreversible</p>
                  <p className="text-sm mt-1">
                    Player {tournament.category || 'classical'} ratings will be permanently updated based on tournament results.
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <div className="font-medium">Rating System Parameters:</div>
                <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                  <li>Floor rating of {FLOOR_RATING} for players without {tournament.category || 'classical'} ratings</li>
                  <li>K=40 for new players (less than 10 games) under 2000 rating</li>
                  <li>K=32 for players rated below 2100</li>
                  <li>K=24 for players rated 2100-2399</li>
                  <li>K=16 for higher-rated players (2400+)</li>
                  <li>Players need 30 games to achieve an established rating</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <div className="font-medium mb-2">Registered Players: {tournamentPlayers.length}</div>
                {tournamentPlayers.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded p-2">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-1">Name</th>
                          <th className="text-right p-1">{tournament.category || 'Classical'} Rating</th>
                          <th className="text-right p-1">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tournamentPlayers.map((player) => {
                          // Get appropriate rating and status for display
                          let displayRating: number;
                          let gamesPlayed: number;
                          let statusText: string;
                          
                          if (tournament.category === 'rapid') {
                            displayRating = player.rapidRating ?? FLOOR_RATING;
                            gamesPlayed = player.rapidGamesPlayed ?? 0;
                            statusText = player.rapidRatingStatus === 'established' ? 'Established' : `Provisional (${gamesPlayed}/30)`;
                          } else if (tournament.category === 'blitz') {
                            displayRating = player.blitzRating ?? FLOOR_RATING;
                            gamesPlayed = player.blitzGamesPlayed ?? 0;
                            statusText = player.blitzRatingStatus === 'established' ? 'Established' : `Provisional (${gamesPlayed}/30)`;
                          } else {
                            displayRating = player.rating;
                            gamesPlayed = player.gamesPlayed || 0;
                            statusText = player.ratingStatus === 'established' ? 'Established' : `Provisional (${gamesPlayed}/30)`;
                          }
                          
                          return (
                            <tr key={player.id} className="border-b border-gray-100 last:border-0">
                              <td className="p-1">{player.name}</td>
                              <td className="text-right p-1">
                                {displayRating}
                              </td>
                              <td className="text-right p-1 flex items-center justify-end">
                                {statusText}
                                {getRatingStatusIcon(player)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={processRatings} 
            disabled={isProcessing || cannotProcess}
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
