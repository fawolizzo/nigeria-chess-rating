import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Loader2, Save } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Player } from '@/lib/mockData';

interface PairingSystemProps {
  players: Player[];
  pairings: Array<{
    whiteId: string;
    blackId: string;
    result?: '1-0' | '0-1' | '1/2-1/2' | '*';
  }>;
  roundNumber: number;
  readonly?: boolean;
  onSaveResults?: (
    results: Array<{
      whiteId: string;
      blackId: string;
      result: '1-0' | '0-1' | '1/2-1/2' | '*';
    }>
  ) => Promise<void>;
  isProcessing?: boolean; // Add the isProcessing prop
}

const ResultSelectOptions = [
  { value: '1-0', label: '1-0 (White Wins)' },
  { value: '0-1', label: '0-1 (Black Wins)' },
  { value: '1/2-1/2', label: '½-½ (Draw)' },
  { value: '*', label: '* (Not Played)' },
];

const PairingSystem: React.FC<PairingSystemProps> = ({
  players,
  pairings,
  roundNumber,
  readonly = false,
  onSaveResults,
  isProcessing = false, // Default to false
}) => {
  const [localPairings, setLocalPairings] = useState<
    Array<{
      whiteId: string;
      blackId: string;
      result: '1-0' | '0-1' | '1/2-1/2' | '*';
    }>
  >(
    pairings.map((pairing) => ({
      ...pairing,
      result: pairing.result || '*',
    }))
  );

  const [hasChanges, setHasChanges] = useState(false);

  // Update local pairings when the pairings prop changes
  useEffect(() => {
    setLocalPairings(
      pairings.map((pairing) => ({
        ...pairing,
        result: pairing.result || '*',
      }))
    );
    setHasChanges(false);
  }, [pairings]);

  const getPlayerById = (id: string): Player | undefined => {
    return players.find((player) => player.id === id);
  };

  const handleResultChange = (
    index: number,
    result: '1-0' | '0-1' | '1/2-1/2' | '*'
  ) => {
    const newPairings = [...localPairings];
    newPairings[index].result = result;
    setLocalPairings(newPairings);
    setHasChanges(true);
  };

  const handleSaveResults = async () => {
    if (onSaveResults) {
      await onSaveResults(localPairings);
      setHasChanges(false);
    }
  };

  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Round {roundNumber} Pairings</h3>
      <div className="space-y-4">
        {localPairings.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">White</th>
                    <th className="text-left py-2 font-medium">Black</th>
                    <th className="text-left py-2 font-medium">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {localPairings.map((pairing, index) => {
                    const whitePlayer = getPlayerById(pairing.whiteId);
                    const blackPlayer = getPlayerById(pairing.blackId);

                    return (
                      <tr key={index} className="border-b dark:border-gray-800">
                        <td className="py-2">{index + 1}</td>
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="font-medium">
                              {whitePlayer?.name ||
                                `Unknown (${pairing.whiteId})`}
                            </div>
                            <div className="ml-2 text-gray-500">
                              {whitePlayer ? `(${whitePlayer.rating})` : ''}
                            </div>
                          </div>
                        </td>
                        <td className="py-2">
                          <div className="flex items-center">
                            <div className="font-medium">
                              {blackPlayer?.name ||
                                `Unknown (${pairing.blackId})`}
                            </div>
                            <div className="ml-2 text-gray-500">
                              {blackPlayer ? `(${blackPlayer.rating})` : ''}
                            </div>
                          </div>
                        </td>
                        <td className="py-2">
                          {readonly ? (
                            <div
                              className={`px-3 py-1 rounded-md inline-block 
                                ${
                                  pairing.result === '1-0'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : pairing.result === '0-1'
                                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                      : pairing.result === '1/2-1/2'
                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                }`}
                            >
                              {pairing.result === '1/2-1/2'
                                ? '½-½'
                                : pairing.result}
                            </div>
                          ) : (
                            <Select
                              value={localPairings[index].result}
                              onValueChange={(value) =>
                                handleResultChange(
                                  index,
                                  value as '1-0' | '0-1' | '1/2-1/2' | '*'
                                )
                              }
                              disabled={isProcessing}
                            >
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select result..." />
                              </SelectTrigger>
                              <SelectContent>
                                {ResultSelectOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!readonly && onSaveResults && (
              <div className="flex justify-end mt-4">
                <Button
                  onClick={handleSaveResults}
                  disabled={!hasChanges || isProcessing}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Results
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No pairings have been generated for this round.
          </div>
        )}
      </div>
    </div>
  );
};

export default PairingSystem;
