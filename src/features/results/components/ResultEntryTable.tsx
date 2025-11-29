import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  updatePairingResult,
  getRoundPairings,
  checkRoundComplete,
  GameResult,
} from '../api/updateResult';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Save, CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Player {
  id: string;
  full_name: string;
  state: string | null;
}

interface Pairing {
  id: string;
  board_number: number;
  white_player: Player;
  black_player: Player | null;
  result: GameResult | null;
  result_entered_by?: string | null;
  updated_at: string;
}

interface Round {
  id: string;
  number: number;
  status: string;
  tournament_id: string;
}

interface ResultEntryTableProps {
  round: Round;
  onRoundComplete?: () => void;
}

export function ResultEntryTable({
  round,
  onRoundComplete,
}: ResultEntryTableProps) {
  const [pairings, setPairings] = useState<Pairing[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [roundStatus, setRoundStatus] = useState({
    isComplete: false,
    totalPairings: 0,
    completedPairings: 0,
  });

  const { user } = useAuth();

  const resultOptions: {
    value: GameResult;
    label: string;
    description: string;
  }[] = [
    { value: 'white_win', label: '1-0', description: 'White wins' },
    { value: 'black_win', label: '0-1', description: 'Black wins' },
    { value: 'draw', label: '½-½', description: 'Draw' },
    {
      value: 'white_forfeit',
      label: '0-1 (WF)',
      description: 'White forfeits',
    },
    {
      value: 'black_forfeit',
      label: '1-0 (BF)',
      description: 'Black forfeits',
    },
    { value: 'double_forfeit', label: '0-0', description: 'Both forfeit' },
  ];

  const loadPairings = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getRoundPairings(round.id);

      if (result.success) {
        setPairings(result.pairings as Pairing[]);

        // Check round completion status
        const statusResult = await checkRoundComplete(round.id);
        if (statusResult.success) {
          setRoundStatus({
            isComplete: statusResult.isComplete,
            totalPairings: statusResult.totalPairings,
            completedPairings: statusResult.completedPairings,
          });
        }
      } else {
        setError(result.error || 'Failed to load pairings');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPairings();
  }, [round.id]);

  const handleResultUpdate = async (pairingId: string, result: GameResult) => {
    if (!user?.id) return;

    setUpdating((prev) => new Set(prev).add(pairingId));
    setError(null);
    setSuccess(null);

    try {
      const updateResult = await updatePairingResult({
        pairingId,
        result,
        organizerId: user.id,
      });

      if (updateResult.success) {
        setSuccess('Result updated successfully');
        await loadPairings(); // Reload to get updated data

        // Check if round is now complete
        const statusResult = await checkRoundComplete(round.id);
        if (statusResult.success && statusResult.isComplete) {
          onRoundComplete?.();
        }
      } else {
        setError(updateResult.error || 'Failed to update result');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setUpdating((prev) => {
        const newSet = new Set(prev);
        newSet.delete(pairingId);
        return newSet;
      });
    }
  };

  const getResultDisplay = (result: GameResult | null) => {
    if (!result) return null;

    const option = resultOptions.find((opt) => opt.value === result);
    return option ? option.label : result;
  };

  const getResultBadge = (result: GameResult | null) => {
    if (!result) {
      return <Badge variant="outline">Pending</Badge>;
    }

    return <Badge variant="secondary">{getResultDisplay(result)}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Round {round.number} - Result Entry
          </div>
          <div className="flex items-center gap-2">
            {roundStatus.isComplete ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Complete
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {roundStatus.completedPairings}/{roundStatus.totalPairings}
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription>
          Enter results for each pairing. All results must be entered before the
          round can be completed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {pairings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No pairings found for this round</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Board</TableHead>
                  <TableHead>White</TableHead>
                  <TableHead>Black</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead className="w-48">Enter Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pairings.map((pairing) => (
                  <TableRow key={pairing.id}>
                    <TableCell className="font-medium">
                      {pairing.board_number}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {pairing.white_player.full_name}
                        </div>
                        {pairing.white_player.state && (
                          <div className="text-sm text-gray-500">
                            {pairing.white_player.state}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {pairing.black_player ? (
                        <div>
                          <div className="font-medium">
                            {pairing.black_player.full_name}
                          </div>
                          {pairing.black_player.state && (
                            <div className="text-sm text-gray-500">
                              {pairing.black_player.state}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 italic">Bye</span>
                      )}
                    </TableCell>
                    <TableCell>{getResultBadge(pairing.result)}</TableCell>
                    <TableCell>
                      {pairing.result === 'bye' ? (
                        <span className="text-sm text-gray-500">
                          Automatic bye
                        </span>
                      ) : (
                        <Select
                          value={pairing.result || ''}
                          onValueChange={(value: GameResult) =>
                            handleResultUpdate(pairing.id, value)
                          }
                          disabled={updating.has(pairing.id)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select result" />
                          </SelectTrigger>
                          <SelectContent>
                            {resultOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                <div>
                                  <div className="font-medium">
                                    {option.label}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {option.description}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {updating.has(pairing.id) && (
                        <div className="flex items-center gap-2 mt-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="text-xs text-gray-500">
                            Updating...
                          </span>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {roundStatus.isComplete && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Round Complete!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              All results have been entered. You can now complete this round to
              generate the next round or finish the tournament.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
