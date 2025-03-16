
import React from "react";
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
}: PairingsTabProps) => {
  const currentPairings = pairings?.find(p => p.roundNumber === selectedRound)?.matches || [];
  const isOngoing = tournamentStatus === "ongoing";
  const isCurrentRound = selectedRound === currentRound;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Round {selectedRound} Pairings</CardTitle>
          
          <div className="flex gap-2">
            {isOngoing && 
              isCurrentRound &&
              !pairingsGenerated && (
              <Button 
                onClick={onGeneratePairings}
                className="flex items-center gap-1"
              >
                <Plus size={16} /> Generate Pairings
              </Button>
            )}
          </div>
        </div>
        
        {totalRounds > 1 && (
          <div className="flex gap-1 mt-4 flex-wrap">
            {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => (
              <Button
                key={round}
                variant={selectedRound === round ? "default" : "outline"}
                size="sm"
                className="min-w-[40px]"
                onClick={() => onRoundSelect(round)}
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
              onSaveResults={onSaveResults}
            />
          ) : (
            <PairingSystem
              players={players}
              pairings={currentPairings}
              roundNumber={selectedRound}
              readonly={true}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PairingsTab;
