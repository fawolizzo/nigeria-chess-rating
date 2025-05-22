
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";

interface RoundControllerProps {
  currentRound: number;
  totalRounds: number;
  onAdvanceRound: () => Promise<void>;
  canAdvanceRound: boolean;
  isProcessing: boolean;
}

const RoundController = ({
  currentRound,
  totalRounds,
  onAdvanceRound,
  canAdvanceRound,
  isProcessing
}: RoundControllerProps) => {
  const handleAdvanceRound = async () => {
    await onAdvanceRound();
  };

  return (
    <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-md mb-4">
      <div>
        <span className="font-medium">Round:</span> {currentRound} of {totalRounds}
      </div>
      
      {currentRound < totalRounds && (
        <Button
          size="sm"
          onClick={handleAdvanceRound}
          disabled={!canAdvanceRound || isProcessing}
          className="flex items-center gap-1"
        >
          {isProcessing ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Next Round
              <ChevronRight size={16} />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default RoundController;
