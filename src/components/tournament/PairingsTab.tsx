import React from 'react';
import { Button } from '@/components/ui/button';
import { Trophy, Users } from 'lucide-react';

export interface PairingsTabProps {
  tournamentId: string;
  onGeneratePairings: () => Promise<void>;
  onRecordResult: (pairingId: string, result: string) => Promise<void>;
  onNextRound: () => Promise<void>;
  isOrganizer: boolean;
  isProcessing: boolean;
}

const PairingsTab: React.FC<PairingsTabProps> = ({
  tournamentId,
  onGeneratePairings,
  onRecordResult,
  onNextRound,
  isOrganizer,
  isProcessing,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
        <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No pairings yet
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Tournament pairings will appear here once generated.
        </p>
        {isOrganizer && (
          <Button onClick={onGeneratePairings} disabled={isProcessing}>
            <Users className="h-4 w-4 mr-2" />
            Generate Pairings
          </Button>
        )}
      </div>
    </div>
  );
};

export default PairingsTab;
