import React, { useState, useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  processRatings,
  getRatingJobStatus,
  getTournamentRatingChanges,
  RatingJobStatus as JobStatus,
  RatingChange,
} from '../api/processRatings';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import {
  Loader2,
  Calculator,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';

interface RatingJobStatusProps {
  tournamentId: string;
  tournamentStatus: string;
  onRatingsProcessed?: () => void;
}

export function RatingJobStatus({
  tournamentId,
  tournamentStatus,
  onRatingsProcessed,
}: RatingJobStatusProps) {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [ratingChanges, setRatingChanges] = useState<RatingChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { user } = useAuth();

  const loadJobStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getRatingJobStatus(tournamentId);

      if (result.success) {
        setJob(result.job || null);

        // If job is completed, load rating changes
        if (result.job?.status === 'completed') {
          const changesResult = await getTournamentRatingChanges(tournamentId);
          if (changesResult.success) {
            setRatingChanges(changesResult.changes);
          }
        }
      } else {
        setError(result.error || 'Failed to load rating job status');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobStatus();
  }, [tournamentId]);

  const handleProcessRatings = async () => {
    if (!user?.id) return;

    setProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await processRatings({
        tournamentId,
        organizerId: user.id,
      });

      if (result.success) {
        setSuccess(
          `Ratings processed successfully for ${result.playersProcessed} players!`
        );
        await loadJobStatus();
        onRatingsProcessed?.();
      } else {
        setError(result.error || 'Failed to process ratings');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      case 'running':
        return <Badge variant="secondary">Running</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRatingChangeIcon = (delta: number) => {
    if (delta > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (delta < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getRatingChangeColor = (delta: number) => {
    if (delta > 0) return 'text-green-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-600';
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

  // Show process button if tournament is completed but ratings not processed
  if (tournamentStatus === 'completed' && (!job || job.status === 'failed')) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Rating Processing
          </CardTitle>
          <CardDescription>
            Tournament is complete. Process ratings to update player ratings
            based on tournament results.
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

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Rating Calculation Process
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Applies Nigerian Chess Rating System (NCRS) rules</li>
                <li>• Uses appropriate K-factors based on player experience</li>
                <li>• Updates player ratings and game counts</li>
                <li>• Creates audit trail of all changes</li>
              </ul>
            </div>

            <Button
              onClick={handleProcessRatings}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing Ratings...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Process Ratings
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show job status if ratings are being processed or completed
  if (job) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Rating Processing Status
            </div>
            {getStatusBadge(job.status)}
          </CardTitle>
          <CardDescription>
            {job.status === 'completed' &&
              'Ratings have been successfully processed and updated'}
            {job.status === 'running' && 'Rating calculation is in progress'}
            {job.status === 'failed' &&
              'Rating processing failed - please try again'}
            {job.status === 'pending' && 'Rating processing is queued'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Job Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Started:</span>{' '}
                {job.started_at
                  ? format(new Date(job.started_at), 'MMM d, yyyy HH:mm')
                  : 'Not started'}
              </div>
              <div>
                <span className="font-medium">Finished:</span>{' '}
                {job.finished_at
                  ? format(new Date(job.finished_at), 'MMM d, yyyy HH:mm')
                  : 'In progress'}
              </div>
            </div>

            {/* Rating Changes Table */}
            {job.status === 'completed' && ratingChanges.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium">Rating Changes</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Player</TableHead>
                      <TableHead className="text-center">Old Rating</TableHead>
                      <TableHead className="text-center">New Rating</TableHead>
                      <TableHead className="text-center">Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ratingChanges.map((change) => (
                      <TableRow key={change.player_id}>
                        <TableCell>
                          <div className="font-medium">
                            Player {change.player_id.slice(0, 8)}...
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {change.old_rating}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-medium">
                            {change.new_rating}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <div
                            className={`flex items-center justify-center gap-1 ${getRatingChangeColor(change.delta)}`}
                          >
                            {getRatingChangeIcon(change.delta)}
                            <span className="font-medium">
                              {change.delta > 0 ? '+' : ''}
                              {change.delta}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <strong>Summary:</strong> {ratingChanges.length} players
                  processed. Average change:{' '}
                  {Math.round(
                    ratingChanges.reduce(
                      (sum, c) => sum + Math.abs(c.delta),
                      0
                    ) / ratingChanges.length
                  )}{' '}
                  points.
                </div>
              </div>
            )}

            {/* Running Status */}
            {job.status === 'running' && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing ratings... This may take a few moments.</span>
              </div>
            )}

            {/* Failed Status */}
            {job.status === 'failed' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Rating processing failed. Please try processing ratings again.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
