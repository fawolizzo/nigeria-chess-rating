import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Player } from "@/lib/mockData";
import PairingSystem from "@/components/PairingSystem";
import ResultRecorder from "@/components/ResultRecorder";

interface PairingsTabProps {
  tournamentStatus: string;
  currentRound: number;
  totalRounds: number;
  selectedRound: number;
  pairings: Array<{
    roundNumber: number;
    matches: Array<{
      whiteId: string;
      blackId: string;
      result?: "1-0" | "0-1" | "1/2-1/2" | "*"
      whiteRatingChange?: number;
      blackRatingChange?: number;
    }>
  }> | undefined;
  players: Player[];
  pairingsGenerated: boolean;
  onRoundSelect: (round: number) => void;
  onGeneratePairings: () => void;
  onSaveResults: (results: Array<{
    whiteId: string;
    blackId: string;
    result: "1-0" | "0-1" | "1/2-1/2" | "*"
  }>) => void;
  canAdvanceRound?: boolean;
  tournamentType?: 'classical' | 'rapid' | 'blitz';
}

const PairingsTab = ({
  tournamentStatus,
  currentRound,
  totalRounds,
  selectedRound,
  pairings,
  players,
  pairingsGenerated,
  onRoundSelect,
  onGeneratePairings,
  onSaveResults,
  canAdvanceRound,
  tournamentType = 'classical',
}: PairingsTabProps) => {
  const currentPairings = pairings?.find(p => p.roundNumber === selectedRound)?.matches || [];
  const isOngoing = tournamentStatus === "ongoing";
  const isCurrentRound = selectedRound === currentRound;
  
  const calculatePreviousOpponents = () => {
    if (!pairings) return {};
    
    const previousOpponents: Record<string, string[]> = {};
    
    players.forEach(player => {
      previousOpponents[player.id] = [];
    });
    
    const previousRounds = pairings.filter(round => round.roundNumber < selectedRound);
    
    previousRounds.forEach(round => {
      round.matches.forEach(match => {
        if (!previousOpponents[match.whiteId]) {
          previousOpponents[match.whiteId] = [];
        }
        if (!previousOpponents[match.blackId]) {
          previousOpponents[match.blackId] = [];
        }
        
        previousOpponents[match.whiteId].push(match.blackId);
        previousOpponents[match.blackId].push(match.whiteId);
      });
    });
    
    return previousOpponents;
  };
  
  const calculatePlayerScores = () => {
    if (!pairings) return {};
    
    const scores: Record<string, number> = {};
    
    players.forEach(player => {
      scores[player.id] = 0;
    });
    
    const previousRounds = pairings.filter(round => round.roundNumber < selectedRound);
    
    previousRounds.forEach(round => {
      round.matches.forEach(match => {
        if (match.result === "1-0") {
          scores[match.whiteId] = (scores[match.whiteId] || 0) + 1;
        } else if (match.result === "0-1") {
          scores[match.blackId] = (scores[match.blackId] || 0) + 1;
        } else if (match.result === "1/2-1/2") {
          scores[match.whiteId] = (scores[match.whiteId] || 0) + 0.5;
          scores[match.blackId] = (scores[match.blackId] || 0) + 0.5;
        }
      });
    });
    
    return scores;
  };

  const handleSaveResults = (results: Array<{
    whiteId: string;
    blackId: string;
    result: "1-0" | "0-1" | "1/2-1/2" | "*"
  }>) => {
    onSaveResults(results);
  };

  const shouldShowGeneratePairingsButton = () => {
    return isOngoing && isCurrentRound && !pairingsGenerated;
  };

  return (
    <Card className="border-nigeria-green">
      <CardHeader className="bg-gradient-to-r from-nigeria-green/10 to-transparent">
        <div className="flex justify-between items-center">
          <CardTitle className="text-nigeria-green-dark text-2xl">Round {selectedRound} Pairings</CardTitle>
          
          <div className="flex gap-2">
            {shouldShowGeneratePairingsButton() && (
              <Button 
                onClick={onGeneratePairings}
                className="flex items-center gap-1 bg-nigeria-green hover:bg-nigeria-green-dark"
              >
                <Plus size={16} /> Generate Pairings
              </Button>
            )}
          </div>
        </div>
        
        {totalRounds > 1 && (
          <div className="flex gap-1 mt-4 flex-wrap justify-center">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => (
              <Button
                key={round}
                variant={selectedRound === round ? "default" : "outline"}
                size="sm"
                className={`min-w-[48px] ${
                  selectedRound === round 
                    ? "bg-nigeria-green hover:bg-nigeria-green-dark" 
                    : "text-nigeria-green border-nigeria-green/50 hover:bg-nigeria-green/10"
                }`}
                onClick={() => onRoundSelect(round)}
                disabled={round > currentRound} // Disable future rounds
              >
                {round}
              </Button>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div>
          {isOngoing && isCurrentRound ? (
            <ResultRecorder
              pairings={currentPairings}
              players={players}
              roundNumber={selectedRound}
              onSaveResults={handleSaveResults}
              tournamentType={tournamentType}
            />
          ) : (
            <PairingSystem
              players={players}
              pairings={currentPairings}
              previousOpponents={calculatePreviousOpponents()}
              playerScores={calculatePlayerScores()}
              roundNumber={selectedRound}
              readonly={true}
              tournamentType={tournamentType}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PairingsTab;
