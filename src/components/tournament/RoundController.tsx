import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, SkipForward, Trophy } from 'lucide-react';

export interface RoundControllerProps {
  tournamentId: string;
  currentRound: number;
  totalRounds: number;
  onGeneratePairings: () => Promise<void>;
  onNextRound: () => Promise<void>;
  isOrganizer: boolean;
  isProcessing: boolean;
}

const RoundController: React.FC<RoundControllerProps> = ({
  tournamentId,
  currentRound,
  totalRounds,
  onGeneratePairings,
  onNextRound,
  isOrganizer,
  isProcessing,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Round {currentRound} of {totalRounds}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Manage the current round and generate pairings for the next round.
          </p>

          {isOrganizer && (
            <div className="flex gap-2">
              <Button
                onClick={onGeneratePairings}
                disabled={isProcessing}
                variant="outline"
              >
                <Play className="h-4 w-4 mr-2" />
                Generate Pairings
              </Button>

              {currentRound < totalRounds && (
                <Button onClick={onNextRound} disabled={isProcessing}>
                  <SkipForward className="h-4 w-4 mr-2" />
                  Next Round
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RoundController;
