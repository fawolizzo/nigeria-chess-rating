
import React from "react";
import { Button } from "@/components/ui/button";

interface RoundControllerProps {
  currentRound: number;
  totalRounds: number;
  onAdvanceRound: () => void;
}

const RoundController = ({ currentRound, totalRounds, onAdvanceRound }: RoundControllerProps) => {
  if (!currentRound) return null;
  
  return (
    <div className="flex items-center gap-2 mb-6">
      <span className="text-sm font-medium">
        Current Round: {currentRound} of {totalRounds}
      </span>
      
      {currentRound < totalRounds && (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={onAdvanceRound}
          className="ml-2"
        >
          Advance to Next Round
        </Button>
      )}
    </div>
  );
};

export default RoundController;
