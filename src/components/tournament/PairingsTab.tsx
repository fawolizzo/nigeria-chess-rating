import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, CheckCircleIcon, RefreshCw } from "lucide-react";
import PairingSystem from "@/components/PairingSystem";
import { Player } from "@/lib/mockData";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface PairingsTabProps {
  tournamentStatus: string;
  currentRound: number;
  totalRounds: number;
  selectedRound: number;
  pairings?: {
    roundNumber: number;
    matches: {
      whiteId: string;
      blackId: string;
      result?: "1-0" | "0-1" | "1/2-1/2" | "*";
      whiteRatingChange?: number;
      blackRatingChange?: number;
    }[];
  }[];
  players: Player[];
  pairingsGenerated: boolean;
  onGeneratePairings: () => void;
  onSaveResults: (results: { whiteId: string; blackId: string; result: "1-0" | "0-1" | "1/2-1/2" | "*" }[]) => void;
  canAdvanceRound: boolean;
  tournamentType: 'classical' | 'rapid' | 'blitz';
  isProcessing: boolean;
  onRoundSelect: (round: number) => void; // Add this line
}

const PairingsTab = ({
  tournamentStatus,
  currentRound,
  totalRounds,
  selectedRound,
  pairings,
  players,
  pairingsGenerated,
  onGeneratePairings,
  onSaveResults,
  canAdvanceRound,
  tournamentType,
  isProcessing,
  onRoundSelect
}: PairingsTabProps) => {
  const isEditable = selectedRound === currentRound && tournamentStatus === "ongoing";
  const currentRoundPairings = pairings?.find(p => p.roundNumber === selectedRound)?.matches || [];

  return (
    <div className="space-y-4">
      {/* Round Navigation */}
      <div className="flex justify-between items-center border-b pb-4">
        <div className="font-medium">Rounds:</div>
        <div className="flex gap-1 flex-wrap">
          {Array.from({ length: totalRounds }, (_, i) => i + 1).map(round => (
            <Button
              key={round}
              size="sm"
              variant={selectedRound === round ? "default" : "outline"}
              onClick={() => onRoundSelect(round)}
              disabled={isProcessing}
              className="min-w-[40px]"
            >
              {round}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Generate Pairings Button for Current Round */}
      {selectedRound === currentRound && tournamentStatus === "ongoing" && !pairingsGenerated && (
        <div className="flex justify-center py-4">
          <Button
            onClick={onGeneratePairings}
            disabled={!canGeneratePairings || isProcessing}
            className="flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus size={16} />
                Generate Round {currentRound} Pairings
              </>
            )}
          </Button>
        </div>
      )}
      
      {/* Warning if pairings not yet generated */}
      {selectedRound === currentRound && !pairingsGenerated && tournamentStatus === "ongoing" && (
        <Alert variant="warning" className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300">
          <AlertDescription>
            Pairings for Round {currentRound} have not been generated yet.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Actual Pairings */}
      {currentRoundPairings.length > 0 ? (
        <div className="border rounded-md p-4">
          <PairingSystem
            players={players}
            pairings={currentRoundPairings}
            roundNumber={selectedRound}
            readonly={!isEditable}
            onSaveResults={isEditable ? onSaveResults : undefined}
            isProcessing={isProcessing}
          />
        </div>
      ) : (
        <>
          {pairingsGenerated && selectedRound === currentRound ? (
            <div className="flex flex-col items-center py-12 text-gray-500 dark:text-gray-400">
              <Loader2 size={24} className="animate-spin mb-4" />
              <p>Loading pairings...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-12 text-gray-500 dark:text-gray-400">
              {selectedRound > currentRound ? (
                <p>This round has not started yet.</p>
              ) : selectedRound < currentRound ? (
                <p>No pairings were recorded for this round.</p>
              ) : null}
            </div>
          )}
        </>
      )}
      
      {/* Refresh Button (typically for debugging) */}
      {process.env.NODE_ENV === 'development' && currentRoundPairings.length > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGeneratePairings}
            disabled={isProcessing || tournamentStatus !== "ongoing"}
            className="text-xs flex items-center gap-1 h-7"
          >
            <RefreshCw size={12} />
            Regenerate Pairings
          </Button>
        </div>
      )}
    </div>
  );
};

export default PairingsTab;
