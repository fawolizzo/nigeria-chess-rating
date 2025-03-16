
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/lib/mockData";

interface PairingSystemProps {
  players: Player[];
  existingPairings?: Array<{ whiteId: string; blackId: string }>;
  previousOpponents?: Record<string, string[]>;
  playerScores?: Record<string, number>;
  onGeneratePairings?: (pairings: Array<{ white: Player; black: Player }>) => void;
  readOnly?: boolean;
  pairings?: Array<{
    whiteId: string;
    blackId: string;
    result?: "1-0" | "0-1" | "1/2-1/2" | "*";
    whiteRatingChange?: number;
    blackRatingChange?: number;
  }>;
  roundNumber?: number;
  readonly?: boolean;
}

interface PairingDisplayData {
  white: Player;
  black: Player;
  result?: "1-0" | "0-1" | "1/2-1/2" | "*";
  whiteRatingChange?: number;
  blackRatingChange?: number;
}

const PairingSystem = ({
  players,
  existingPairings = [],
  previousOpponents = {},
  playerScores = {},
  onGeneratePairings,
  readOnly = false,
  pairings = [],
  roundNumber,
  readonly = false,
}: PairingSystemProps) => {
  const [localPairings, setLocalPairings] = useState<Array<{ white: Player; black: Player }>>(
    existingPairings.map(pair => {
      const white = players.find(p => p.id === pair.whiteId)!;
      const black = players.find(p => p.id === pair.blackId)!;
      return { white, black };
    })
  );

  // Function to convert pairings to display format
  const getPairingsToDisplay = (): PairingDisplayData[] => {
    if (pairings && pairings.length > 0) {
      return pairings.map(pair => {
        const white = players.find(p => p.id === pair.whiteId);
        const black = players.find(p => p.id === pair.blackId);
        
        if (white && black) {
          return {
            white,
            black,
            result: pair.result,
            whiteRatingChange: pair.whiteRatingChange,
            blackRatingChange: pair.blackRatingChange
          };
        }
        return null;
      }).filter(Boolean) as PairingDisplayData[];
    }
    
    return localPairings as PairingDisplayData[];
  };

  // Improved Swiss pairing algorithm
  const generateSwissPairings = () => {
    // Check if we have enough players
    if (players.length < 2) {
      console.warn("Not enough players to generate pairings");
      return;
    }

    // Step 1: Use playerScores from props if provided, otherwise initialize
    const playerScoringMap = { ...playerScores };
    const playerOpponentsMap: Record<string, string[]> = {};
    
    // Initialize scores and opponent lists
    players.forEach(player => {
      if (playerScoringMap[player.id] === undefined) {
        playerScoringMap[player.id] = 0;
      }
      playerOpponentsMap[player.id] = previousOpponents[player.id] || [];
    });
    
    // Step 2: Group players by their score
    const scoreGroups: Record<number, Player[]> = {};
    
    players.forEach(player => {
      const score = playerScoringMap[player.id] || 0;
      scoreGroups[score] = scoreGroups[score] || [];
      scoreGroups[score].push(player);
    });
    
    // Sort score groups from highest to lowest
    const sortedScoreGroups = Object.entries(scoreGroups)
      .sort(([scoreA, _], [scoreB, __]) => Number(scoreB) - Number(scoreA))
      .map(([_, players]) => players);
    
    // Step 3: Generate pairings within each score group
    const matches: { white: Player; black: Player }[] = [];
    const paired: Set<string> = new Set();
    
    // Try to pair within each score group first
    sortedScoreGroups.forEach(playersInGroup => {
      // Sort players by rating within the score group
      const sortedPlayers = [...playersInGroup].sort((a, b) => b.rating - a.rating);
      
      // Try to pair players within this score group
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        
        if (paired.has(player.id)) continue;
        
        let pairingFound = false;
        
        // Look for an unpaired opponent who hasn't played this player before
        for (let j = i + 1; j < sortedPlayers.length; j++) {
          const opponent = sortedPlayers[j];
          
          if (paired.has(opponent.id)) continue;
          
          // Check if these players have faced each other before
          const opponentList = playerOpponentsMap[player.id] || [];
          if (!opponentList.includes(opponent.id)) {
            // Pair these players
            const isWhite = Math.random() > 0.5; // Random color assignment
            
            if (isWhite) {
              matches.push({ white: player, black: opponent });
            } else {
              matches.push({ white: opponent, black: player });
            }
            
            paired.add(player.id);
            paired.add(opponent.id);
            pairingFound = true;
            break;
          }
        }
        
        // If no pairing found in the same score group, we'll handle in the next phase
      }
    });
    
    // Step 4: Handle unpaired players by pairing across score groups
    const unpaired = players.filter(p => !paired.has(p.id))
      .sort((a, b) => {
        // Sort by score (desc) then by rating (desc)
        const scoreA = playerScoringMap[a.id] || 0;
        const scoreB = playerScoringMap[b.id] || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.rating - a.rating;
      });
    
    // Pair remaining players
    for (let i = 0; i < unpaired.length; i += 2) {
      if (i + 1 < unpaired.length) {
        const player1 = unpaired[i];
        const player2 = unpaired[i + 1];
        
        // Assign colors (could be more sophisticated based on color balance)
        const isPlayer1White = Math.random() > 0.5; 
        
        if (isPlayer1White) {
          matches.push({ white: player1, black: player2 });
        } else {
          matches.push({ white: player2, black: player1 });
        }
      } else if (unpaired.length % 2 !== 0) {
        // Odd number of players - the last player gets a bye
        console.log(`Player ${unpaired[i].name} gets a bye for this round`);
        // In a real implementation, we would record the bye and award a point
      }
    }
    
    setLocalPairings(matches);
    if (onGeneratePairings) {
      onGeneratePairings(matches);
    }
  };

  const pairingsToDisplay = getPairingsToDisplay();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {roundNumber ? `Round ${roundNumber} Pairings` : "Swiss Pairing System"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pairingsToDisplay.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {pairingsToDisplay.map((pair, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-800 rounded-lg"
                >
                  <div className="flex items-center space-x-4">
                    <div className="font-semibold text-gray-500 dark:text-gray-400 w-8 text-center">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="bg-white dark:bg-gray-800">
                          White
                        </Badge>
                        <span className="font-medium">
                          {pair.white.title && (
                            <span className="text-gold-dark dark:text-gold-light mr-1">
                              {pair.white.title}
                            </span>
                          )}
                          {pair.white.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({pair.white.rating})
                        </span>
                        {pair.whiteRatingChange !== undefined && (
                          <span className={pair.whiteRatingChange >= 0 ? "text-green-500" : "text-red-500"}>
                            {pair.whiteRatingChange > 0 ? "+" : ""}{pair.whiteRatingChange}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="outline" className="bg-black text-white dark:bg-black">
                          Black
                        </Badge>
                        <span className="font-medium">
                          {pair.black.title && (
                            <span className="text-gold-dark dark:text-gold-light mr-1">
                              {pair.black.title}
                            </span>
                          )}
                          {pair.black.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          ({pair.black.rating})
                        </span>
                        {pair.blackRatingChange !== undefined && (
                          <span className={pair.blackRatingChange >= 0 ? "text-green-500" : "text-red-500"}>
                            {pair.blackRatingChange > 0 ? "+" : ""}{pair.blackRatingChange}
                          </span>
                        )}
                      </div>
                      {pair.result && pair.result !== "*" && (
                        <div className="mt-2 text-center">
                          <Badge variant="secondary">
                            {pair.result === "1-0" ? "1-0 (White won)" : 
                             pair.result === "0-1" ? "0-1 (Black won)" : 
                             "½-½ (Draw)"}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No pairings have been generated yet.
            </p>
            {!readOnly && !readonly && onGeneratePairings && (
              <Button onClick={generateSwissPairings}>Generate Pairings</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PairingSystem;
