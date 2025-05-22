
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Player, Tournament } from '@/lib/mockData';
import { AlertCircle } from 'lucide-react';
import { calculateNewRatings } from '@/lib/ratingCalculation';

interface TournamentRatingDialogProps {
  tournament: Tournament;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onProcessComplete: (processedTournament: Tournament) => void;
}

const TournamentRatingDialog: React.FC<TournamentRatingDialogProps> = ({
  tournament,
  isOpen,
  onOpenChange,
  onProcessComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ratingResults, setRatingResults] = useState<any[]>([]);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');

  // Process tournament's matches and calculate new ratings
  useEffect(() => {
    if (isOpen && tournament) {
      try {
        // Check if tournament is ready for processing
        if (!tournament.rounds || tournament.rounds === 0) {
          setHasError(true);
          setErrorDetails('Tournament has no rounds defined.');
          return;
        }

        if (!tournament.matches || tournament.matches.length === 0) {
          setHasError(true);
          setErrorDetails('Tournament has no matches to process.');
          return;
        }

        // We'd actually calculate the ratings here using tournament data
        // For demo, let's create some mock results
        const mockResults = (tournament.playerIds || []).map(playerId => ({
          playerId,
          initialRating: 1200 + Math.floor(Math.random() * 400),
          finalRating: 1200 + Math.floor(Math.random() * 400),
          gamesPlayed: Math.floor(Math.random() * 5) + 3,
          performance: (Math.random() * 100).toFixed(1) + '%'
        }));

        setRatingResults(mockResults);
        setHasError(false);
      } catch (error) {
        console.error('Error processing tournament ratings:', error);
        setHasError(true);
        setErrorDetails(error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, [isOpen, tournament]);

  const processRatings = async () => {
    try {
      setIsProcessing(true);

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create updated tournament with results
      const processedTournament: Tournament = {
        ...tournament,
        status: "processed", 
        results: ratingResults
      };

      onProcessComplete(processedTournament);
      
      // Close the dialog after processing
      onOpenChange(false);
    } catch (error) {
      console.error('Error finalizing tournament processing:', error);
      setHasError(true);
      setErrorDetails(error instanceof Error ? error.message : 'Failed to process tournament ratings');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Process Tournament Ratings</DialogTitle>
          <DialogDescription>
            Review the calculated rating changes for each player. Once processed, these changes will be applied to player profiles.
          </DialogDescription>
        </DialogHeader>

        {hasError ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorDetails || 'An error occurred while calculating ratings.'}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="max-h-[350px] overflow-y-auto my-4">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Player</th>
                  <th className="py-2 text-right">Initial Rating</th>
                  <th className="py-2 text-right">Final Rating</th>
                  <th className="py-2 text-right">Change</th>
                </tr>
              </thead>
              <tbody>
                {ratingResults.map((result, index) => {
                  const change = result.finalRating - result.initialRating;
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-2 text-left">Player {index + 1}</td>
                      <td className="py-2 text-right">{result.initialRating}</td>
                      <td className="py-2 text-right">{result.finalRating}</td>
                      <td className={`py-2 text-right font-medium ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}`}>
                        {change > 0 ? `+${change}` : change}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={processRatings}
            disabled={isProcessing || hasError || ratingResults.length === 0}
          >
            {isProcessing ? 'Processing...' : 'Process Ratings'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRatingDialog;
