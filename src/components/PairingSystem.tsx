
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";

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

  // Improved Swiss pairing algorithm with stricter prevention of repeat pairings
  const generateSwissPairings = () => {
    // Check if we have enough players
    if (players.length < 2) {
      toast({
        title: "Not Enough Players",
        description: "At least 2 players are required to generate pairings.",
        variant: "destructive",
      });
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
    for (const playersInGroup of sortedScoreGroups) {
      // Sort players by rating within the score group
      const sortedPlayers = [...playersInGroup].sort((a, b) => b.rating - a.rating);
      
      for (let i = 0; i < sortedPlayers.length; i++) {
        const player = sortedPlayers[i];
        
        if (paired.has(player.id)) continue;
        
        // Find best opponent who hasn't been paired already and hasn't played this player before
        let bestOpponentIdx = -1;
        
        for (let j = 0; j < sortedPlayers.length; j++) {
          // Skip self or already paired players
          if (i === j || paired.has(sortedPlayers[j].id)) continue;
          
          const opponent = sortedPlayers[j];
          const opponentList = playerOpponentsMap[player.id] || [];
          
          // Skip if they've already played
          if (opponentList.includes(opponent.id)) continue;
          
          bestOpponentIdx = j;
          break;
        }
        
        // If we found a valid opponent in the same score group
        if (bestOpponentIdx !== -1) {
          const opponent = sortedPlayers[bestOpponentIdx];
          
          // Determine colors (could be more sophisticated with color balancing)
          const isWhite = Math.random() > 0.5; 
          
          if (isWhite) {
            matches.push({ white: player, black: opponent });
          } else {
            matches.push({ white: opponent, black: player });
          }
          
          paired.add(player.id);
          paired.add(opponent.id);
        }
      }
    }
    
    // Step 4: For remaining unpaired players, try pairing across score groups
    // First, collect all unpaired players
    const unpaired = players.filter(p => !paired.has(p.id));
    
    // Sort unpaired players by score and then by rating
    unpaired.sort((a, b) => {
      const scoreA = playerScoringMap[a.id] || 0;
      const scoreB = playerScoringMap[b.id] || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.rating - a.rating;
    });
    
    // Try to pair them while avoiding repeat matchups
    for (let i = 0; i < unpaired.length; i++) {
      if (paired.has(unpaired[i].id)) continue;
      
      const player = unpaired[i];
      const playerOpponents = playerOpponentsMap[player.id] || [];
      
      // Look for a valid opponent
      for (let j = i + 1; j < unpaired.length; j++) {
        if (paired.has(unpaired[j].id)) continue;
        
        const opponent = unpaired[j];
        
        // Skip if they've already played
        if (playerOpponents.includes(opponent.id)) continue;
        
        // Found a valid pairing
        const isWhite = Math.random() > 0.5;
        
        if (isWhite) {
          matches.push({ white: player, black: opponent });
        } else {
          matches.push({ white: opponent, black: player });
        }
        
        paired.add(player.id);
        paired.add(opponent.id);
        break;
      }
    }
    
    // Handle any remaining unpaired players (should only happen in odd-numbered tournaments)
    const stillUnpaired = players.filter(p => !paired.has(p.id));
    
    if (stillUnpaired.length > 1) {
      // We have multiple unpaired players who must have played each other before
      // In this case, we reluctantly allow repeat pairings
      toast({
        title: "Repeat Pairings Required",
        description: "Some players have already played all possible opponents. Repeat pairings were created.",
        variant: "warning",
      });
      
      for (let i = 0; i < stillUnpaired.length; i += 2) {
        if (i + 1 < stillUnpaired.length) {
          const isWhite = Math.random() > 0.5;
          
          if (isWhite) {
            matches.push({ white: stillUnpaired[i], black: stillUnpaired[i + 1] });
          } else {
            matches.push({ white: stillUnpaired[i + 1], black: stillUnpaired[i] });
          }
        } else if (stillUnpaired.length % 2 !== 0) {
          // Odd number of players - the last player gets a bye
          console.log(`Player ${stillUnpaired[i].name} gets a bye for this round`);
          // In a real implementation, we would record the bye and award a point
        }
      }
    } else if (stillUnpaired.length === 1) {
      // Only one player left unpaired - they get a bye
      console.log(`Player ${stillUnpaired[0].name} gets a bye for this round`);
      // In a real implementation, we would record the bye and award a point
    }
    
    setLocalPairings(matches);
    if (onGeneratePairings) {
      onGeneratePairings(matches);
    }
    
    toast({
      title: "Pairings Generated",
      description: `Successfully generated ${matches.length} pairings using the Swiss system.`,
    });
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
