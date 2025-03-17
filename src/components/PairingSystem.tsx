
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Player } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { generateSwissPairings } from "@/lib/swissPairingService";
import { AlertTriangle } from "lucide-react";

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

interface Round {
  roundNumber: number;
  matches: Array<{
    whiteId: string;
    blackId: string;
    result?: "1-0" | "0-1" | "1/2-1/2" | "*";
  }>;
}

const PairingSystem = ({
  players,
  existingPairings = [],
  previousOpponents = {},
  playerScores = {},
  onGeneratePairings,
  readOnly = false,
  pairings = [],
  roundNumber = 1,
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

  // Generate Swiss pairings using our improved algorithm
  const generatePairings = () => {
    // Check if we have enough players
    if (players.length < 2) {
      toast({
        title: "Not Enough Players",
        description: "At least 2 players are required to generate pairings.",
        variant: "destructive",
      });
      return;
    }

    // Reconstruct previous rounds data
    const previousRounds: Round[] = [];
    
    // Convert the opponents map to a structure we can use
    Object.entries(previousOpponents).forEach(([playerId, opponentIds]) => {
      opponentIds.forEach((opponentId, index) => {
        // Create a round record if it doesn't exist yet
        if (!previousRounds[index]) {
          previousRounds[index] = {
            roundNumber: index + 1,
            matches: []
          };
        }
        
        // Only add each match once
        const matchExists = previousRounds[index].matches.some(
          m => (m.whiteId === playerId && m.blackId === opponentId) || 
               (m.whiteId === opponentId && m.blackId === playerId)
        );
        
        if (!matchExists) {
          // Determine result if possible (simplified)
          let result: "1-0" | "0-1" | "1/2-1/2" | "*" = "*";
          
          previousRounds[index].matches.push({
            whiteId: playerId,
            blackId: opponentId,
            result
          });
        }
      });
    });
    
    // Use our improved Swiss pairing algorithm
    const generatedPairings = generateSwissPairings(players, previousRounds, roundNumber);
    
    // Convert to the expected format
    const formattedPairings = generatedPairings.map(pairing => {
      const white = players.find(p => p.id === pairing.whiteId)!;
      const black = players.find(p => p.id === pairing.blackId)!;
      return { white, black };
    });
    
    setLocalPairings(formattedPairings);
    
    if (onGeneratePairings) {
      onGeneratePairings(formattedPairings);
    }
    
    toast({
      title: "Pairings Generated",
      description: `Successfully generated ${formattedPairings.length} pairings using the Swiss system.`,
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
              <Button onClick={generatePairings}>Generate Pairings</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PairingSystem;
