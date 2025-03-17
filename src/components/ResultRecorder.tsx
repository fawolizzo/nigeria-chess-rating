
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Player } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";

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
}

const ResultRecorder = ({ pairings, players, roundNumber, onSaveResults }: ResultRecorderProps) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Round {roundNumber} Results</CardTitle>
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
                  
                  return (
                    <div key={index} className="border rounded-md p-4">
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
                              <p className="text-sm text-gray-500">
                                White • {whitePlayer.rating}
                              </p>
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
                              <p className="text-sm text-gray-500">
                                Black • {blackPlayer.rating}
                              </p>
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
                            <SelectTrigger>
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
                <Button onClick={handleSave}>Save Results</Button>
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
