
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/lib/mockData";

interface PairingSystemProps {
  players: Player[];
  existingPairings?: Array<{ whiteId: string; blackId: string }>;
  previousOpponents?: Record<string, string[]>;
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

  // Enhanced Swiss pairing algorithm
  const generateSwissPairings = () => {
    // Step 1: Group players by their score (or initial rating for first round)
    const playerScoreGroups: Record<number, Player[]> = {};
    
    // If we have previous results, we would calculate scores here
    // For now, just use ratings for initial pairings
    players.forEach(player => {
      const score = 0; // Start with 0 for all in first round
      playerScoreGroups[score] = playerScoreGroups[score] || [];
      playerScoreGroups[score].push(player);
    });
    
    const scoreGroups = Object.keys(playerScoreGroups)
      .map(Number)
      .sort((a, b) => b - a); // Sort by score descending
    
    const matches: { white: Player; black: Player }[] = [];
    const paired: Record<string, boolean> = {};
    
    // Step 2: Pair players within each score group
    scoreGroups.forEach(score => {
      const playersInGroup = [...playerScoreGroups[score]]
        .sort((a, b) => b.rating - a.rating); // Sort by rating within each score group
      
      for (let i = 0; i < playersInGroup.length; i++) {
        if (paired[playersInGroup[i].id]) continue;
        
        let bestOpponentIdx = -1;
        
        // Find best unpaired opponent who hasn't played against this player
        for (let j = i + 1; j < playersInGroup.length; j++) {
          if (paired[playersInGroup[j].id]) continue;
          
          const prevOpponents = previousOpponents[playersInGroup[i].id] || [];
          if (!prevOpponents.includes(playersInGroup[j].id)) {
            bestOpponentIdx = j;
            break;
          }
        }
        
        // If no valid opponent in the same score group, find one in adjacent groups
        if (bestOpponentIdx === -1) {
          // Just pair with next available if no better option
          for (let j = i + 1; j < playersInGroup.length; j++) {
            if (!paired[playersInGroup[j].id]) {
              bestOpponentIdx = j;
              break;
            }
          }
        }
        
        // If opponent found, create the pairing
        if (bestOpponentIdx !== -1) {
          const player1 = playersInGroup[i];
          const player2 = playersInGroup[bestOpponentIdx];
          
          // Alternate colors if possible (would check color history here)
          // For simplicity, randomly assign colors
          if (Math.random() > 0.5) {
            matches.push({ white: player1, black: player2 });
          } else {
            matches.push({ white: player2, black: player1 });
          }
          
          paired[player1.id] = true;
          paired[player2.id] = true;
        }
      }
    });
    
    // Handle odd number of players (assign bye)
    if (players.length % 2 !== 0) {
      // Find lowest-rated unpaired player for bye
      const unpaired = players.filter(p => !paired[p.id])
        .sort((a, b) => a.rating - b.rating);
      
      if (unpaired.length > 0) {
        // In an actual implementation, we would record the bye and award a point
        console.log(`Player ${unpaired[0].name} gets a bye for this round`);
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
