
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import { FLOOR_RATING } from "@/lib/ratingCalculation";
import { BadgeCheck, AlertCircle } from "lucide-react";

interface ResultRecorderProps {
  pairings: Array<{ 
    whiteId: string; 
    blackId: string; 
    result?: "1-0" | "0-1" | "1/2-1/2" | "*" 
  }>;
  players: Player[];
  roundNumber: number;
  onSaveResults: (results: Array<{ 
    whiteId: string; 
    blackId: string; 
    result: "1-0" | "0-1" | "1/2-1/2" | "*" 
  }>) => void;
  tournamentType?: 'classical' | 'rapid' | 'blitz';
}

const ResultRecorder = ({ 
  pairings, 
  players, 
  roundNumber, 
  onSaveResults,
  tournamentType = 'classical'
}: ResultRecorderProps) => {
  const [results, setResults] = useState<Array<{ 
    whiteId: string; 
    blackId: string; 
    result: "1-0" | "0-1" | "1/2-1/2" | "*" 
  }>>(
    pairings.map(pair => ({
      whiteId: pair.whiteId,
      blackId: pair.blackId,
      result: pair.result || "*"
    }))
  );
  const { toast } = useToast();

  useEffect(() => {
    // Update results when pairings change
    setResults(pairings.map(pair => ({
      whiteId: pair.whiteId,
      blackId: pair.blackId,
      result: pair.result || "*"
    })));
  }, [pairings]);

  const handleResultChange = (pairingIndex: number, newResult: "1-0" | "0-1" | "1/2-1/2" | "*") => {
    const newResults = [...results];
    newResults[pairingIndex] = {
      ...newResults[pairingIndex],
      result: newResult
    };
    setResults(newResults);
  };

  const handleSave = () => {
    // Pass results to parent component
    onSaveResults(results);
    
    // Add toast notification to provide feedback
    toast({
      title: "Results Saved",
      description: `Round ${roundNumber} results have been successfully saved.`,
      variant: "default",
    });
  };

  const getPlayerById = (id: string) => {
    return players.find(p => p.id === id);
  };

  // Function to get the appropriate rating based on tournament type
  const getPlayerRating = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidRating ?? FLOOR_RATING;
    } else if (tournamentType === 'blitz') {
      return player.blitzRating ?? FLOOR_RATING;
    }
    return player.rating;
  };
  
  // Function to get the appropriate rating status based on tournament type
  const getPlayerRatingStatus = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidRatingStatus ?? 'provisional';
    } else if (tournamentType === 'blitz') {
      return player.blitzRatingStatus ?? 'provisional';
    }
    return player.ratingStatus ?? 'provisional';
  };
  
  // Function to get the games played count based on tournament type
  const getPlayerGamesPlayed = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidGamesPlayed ?? 0;
    } else if (tournamentType === 'blitz') {
      return player.blitzGamesPlayed ?? 0;
    }
    return player.gamesPlayed ?? 0;
  };

  // Function to check if a player needs to be initialized with a floor rating
  const needsFloorRating = (player: Player) => {
    if (tournamentType === 'rapid') {
      return player.rapidRating === undefined;
    } else if (tournamentType === 'blitz') {
      return player.blitzRating === undefined;
    }
    return false; // Classical rating should always exist
  };

  return (
    <Card className="border-nigeria-green/30">
      <CardHeader className="bg-gradient-to-r from-nigeria-green/5 to-transparent">
        <CardTitle className="text-nigeria-green-dark">Round {roundNumber} Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {results.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-4">
                {results.map((pairing, index) => {
                  const whitePlayer = getPlayerById(pairing.whiteId);
                  const blackPlayer = getPlayerById(pairing.blackId);
                  
                  if (!whitePlayer || !blackPlayer) return null;
                  
                  const whiteRating = getPlayerRating(whitePlayer);
                  const blackRating = getPlayerRating(blackPlayer);
                  const whiteRatingStatus = getPlayerRatingStatus(whitePlayer);
                  const blackRatingStatus = getPlayerRatingStatus(blackPlayer);
                  const whiteGamesPlayed = getPlayerGamesPlayed(whitePlayer);
                  const blackGamesPlayed = getPlayerGamesPlayed(blackPlayer);
                  
                  const whiteNeedsFloorRating = needsFloorRating(whitePlayer);
                  const blackNeedsFloorRating = needsFloorRating(blackPlayer);
                  
                  return (
                    <div key={index} className="border border-nigeria-green/20 rounded-md p-4 hover:bg-nigeria-green/5 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1 mb-3 md:mb-0">
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <div className="w-full md:w-auto">
                              <p className="font-medium">
                                {whitePlayer.title && (
                                  <span className="text-gold-dark dark:text-gold-light mr-1">
                                    {whitePlayer.title}
                                  </span>
                                )}
                                {whitePlayer.name}
                              </p>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <span>White • {whiteRating}</span>
                                {whiteNeedsFloorRating && (
                                  <span className="inline-flex items-center ml-1 text-blue-600 text-xs">
                                    (Floor Rating)
                                  </span>
                                )}
                                {whiteRatingStatus === 'established' ? (
                                  <BadgeCheck size={14} className="text-green-600" />
                                ) : (
                                  <span className="inline-flex items-center ml-1 text-amber-600 text-xs">
                                    <AlertCircle size={12} className="mr-0.5" />
                                    {whiteGamesPlayed}/30
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-center my-2 md:my-0">
                              <span className="text-gray-400">vs</span>
                            </div>
                            
                            <div className="w-full md:w-auto">
                              <p className="font-medium">
                                {blackPlayer.title && (
                                  <span className="text-gold-dark dark:text-gold-light mr-1">
                                    {blackPlayer.title}
                                  </span>
                                )}
                                {blackPlayer.name}
                              </p>
                              <div className="text-sm text-gray-500 flex items-center gap-1">
                                <span>Black • {blackRating}</span>
                                {blackNeedsFloorRating && (
                                  <span className="inline-flex items-center ml-1 text-blue-600 text-xs">
                                    (Floor Rating)
                                  </span>
                                )}
                                {blackRatingStatus === 'established' ? (
                                  <BadgeCheck size={14} className="text-green-600" />
                                ) : (
                                  <span className="inline-flex items-center ml-1 text-amber-600 text-xs">
                                    <AlertCircle size={12} className="mr-0.5" />
                                    {blackGamesPlayed}/30
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="w-full md:w-40">
                          <Select
                            value={pairing.result}
                            onValueChange={(value) => 
                              handleResultChange(index, value as "1-0" | "0-1" | "1/2-1/2" | "*")
                            }
                          >
                            <SelectTrigger className="border-nigeria-green/30 focus:ring-nigeria-green/30">
                              <SelectValue placeholder="Select result" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="*">Not played</SelectItem>
                              <SelectItem value="1-0">1-0 (White wins)</SelectItem>
                              <SelectItem value="0-1">0-1 (Black wins)</SelectItem>
                              <SelectItem value="1/2-1/2">½-½ (Draw)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-4">
                <Button 
                  onClick={handleSave}
                  className="bg-nigeria-green hover:bg-nigeria-green-dark"
                >
                  Save Results
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No pairings available for this round.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultRecorder;
