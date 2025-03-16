
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Player } from "@/lib/mockData";

interface Round {
  roundNumber: number;
  matches: Array<{
    whiteId: string;
    blackId: string;
    result?: "1-0" | "0-1" | "1/2-1/2" | "*";
    whiteRatingChange?: number;
    blackRatingChange?: number;
  }>;
}

interface ResultRecorderProps {
  round: Round;
  players: Player[];
  onSaveResults: (results: Array<{ whiteId: string; blackId: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" }>) => void;
  readOnly?: boolean;
}

const ResultRecorder = ({
  round,
  players,
  onSaveResults,
  readOnly = false,
}: ResultRecorderProps) => {
  const [matchResults, setMatchResults] = useState<Array<{ whiteId: string; blackId: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" }>>(
    round.matches.map(match => ({
      whiteId: match.whiteId,
      blackId: match.blackId,
      result: match.result || "*"
    }))
  );

  useEffect(() => {
    // Update match results when round changes
    setMatchResults(
      round.matches.map(match => ({
        whiteId: match.whiteId,
        blackId: match.blackId,
        result: match.result || "*"
      }))
    );
  }, [round]);

  const handleResultChange = (matchIndex: number, result: "1-0" | "0-1" | "1/2-1/2" | "*") => {
    const newResults = [...matchResults];
    newResults[matchIndex].result = result;
    setMatchResults(newResults);
  };

  const handleSaveResults = () => {
    onSaveResults(matchResults);
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (!player) return "Unknown Player";
    
    return `${player.title ? player.title + " " : ""}${player.name}`;
  };

  const getRatingChangeDisplay = (change?: number) => {
    if (change === undefined) return null;
    
    if (change > 0) {
      return <span className="text-green-600 dark:text-green-400">+{change}</span>;
    } else if (change < 0) {
      return <span className="text-red-600 dark:text-red-400">{change}</span>;
    } else {
      return <span className="text-gray-500">0</span>;
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        {matchResults.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {matchResults.map((match, index) => {
                const originalMatch = round.matches[index];
                return (
                  <div 
                    key={index} 
                    className="flex flex-col md:flex-row justify-between items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg"
                  >
                    <div className="flex flex-col md:flex-row items-center md:space-x-10 w-full md:w-auto mb-4 md:mb-0">
                      <div className="font-semibold text-gray-500 dark:text-gray-400 w-8 text-center mb-2 md:mb-0">
                        {index + 1}
                      </div>
                      
                      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:items-center md:space-x-6 w-full md:w-auto">
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-white dark:bg-gray-800">
                              White
                            </Badge>
                            <span className="font-medium">{getPlayerName(match.whiteId)}</span>
                          </div>
                          {originalMatch.whiteRatingChange !== undefined && (
                            <div className="ml-14 mt-1 text-sm">
                              Rating change: {getRatingChangeDisplay(originalMatch.whiteRatingChange)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-black text-white dark:bg-black">
                              Black
                            </Badge>
                            <span className="font-medium">{getPlayerName(match.blackId)}</span>
                          </div>
                          {originalMatch.blackRatingChange !== undefined && (
                            <div className="ml-14 mt-1 text-sm">
                              Rating change: {getRatingChangeDisplay(originalMatch.blackRatingChange)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {readOnly ? (
                        <div className="px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-md bg-gray-50 dark:bg-gray-800">
                          {match.result === "1-0" && "1-0 (White wins)"}
                          {match.result === "0-1" && "0-1 (Black wins)"}
                          {match.result === "1/2-1/2" && "½-½ (Draw)"}
                          {match.result === "*" && "Not played"}
                        </div>
                      ) : (
                        <Select 
                          value={match.result} 
                          onValueChange={(value) => handleResultChange(index, value as "1-0" | "0-1" | "1/2-1/2" | "*")}
                        >
                          <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Result" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1-0">1-0 (White wins)</SelectItem>
                            <SelectItem value="0-1">0-1 (Black wins)</SelectItem>
                            <SelectItem value="1/2-1/2">½-½ (Draw)</SelectItem>
                            <SelectItem value="*">Not played</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!readOnly && (
              <div className="flex justify-end">
                <Button onClick={handleSaveResults}>Save Results</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No pairings available for this round yet.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResultRecorder;
