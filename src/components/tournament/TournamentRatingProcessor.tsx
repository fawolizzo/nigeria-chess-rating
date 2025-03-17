
import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Player } from "@/lib/mockData";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { calculatePostRoundRatings } from "@/lib/ratingCalculation";

interface TournamentRatingProcessorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  players: Player[];
  matchResults: Array<{
    roundNumber: number;
    matches: Array<{
      whiteId: string;
      blackId: string;
      result: "1-0" | "0-1" | "1/2-1/2" | "*";
    }>;
  }>;
  onProcessComplete: (
    processedMatches: Array<{
      roundNumber: number;
      matches: Array<{
        whiteId: string;
        blackId: string;
        result: "1-0" | "0-1" | "1/2-1/2" | "*";
        whiteRatingChange: number;
        blackRatingChange: number;
      }>;
    }>
  ) => void;
}

const TournamentRatingProcessor = ({
  isOpen,
  onOpenChange,
  players,
  matchResults,
  onProcessComplete
}: TournamentRatingProcessorProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const processRatings = () => {
    setIsProcessing(true);
    
    try {
      // Process each round of matches
      const processedRounds = matchResults.map(round => {
        // For each match in the round, calculate rating changes
        const processedMatches = calculatePostRoundRatings(
          round.matches.map(match => {
            const whitePlayer = players.find(p => p.id === match.whiteId);
            const blackPlayer = players.find(p => p.id === match.blackId);
            
            if (!whitePlayer || !blackPlayer) {
              throw new Error(`Player not found: ${match.whiteId} or ${match.blackId}`);
            }
            
            return {
              ...match,
              whiteRating: whitePlayer.rating,
              blackRating: blackPlayer.rating,
              whiteGamesPlayed: whitePlayer.gamesPlayed || 0,
              blackGamesPlayed: blackPlayer.gamesPlayed || 0
            };
          })
        );
        
        return {
          roundNumber: round.roundNumber,
          matches: processedMatches
        };
      });
      
      // Ensure all matches have whiteRatingChange and blackRatingChange
      const fullyProcessedRounds = processedRounds.map(round => {
        return {
          roundNumber: round.roundNumber,
          matches: round.matches.map(match => {
            return {
              ...match,
              whiteRatingChange: match.whiteRatingChange ?? 0,
              blackRatingChange: match.blackRatingChange ?? 0
            };
          })
        };
      });
      
      // Call the callback with processed results
      onProcessComplete(fullyProcessedRounds);
      
      toast({
        title: "Ratings processed successfully",
        description: "All match results have been processed and ratings updated.",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error processing ratings:", error);
      
      toast({
        title: "Error processing ratings",
        description: "An error occurred while processing ratings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Process Tournament Ratings</DialogTitle>
          <DialogDescription>
            This will calculate rating changes for all completed matches using the Nigerian Chess Rating System.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Rating changes will be calculated</p>
                <p className="text-sm mt-1">
                  This will apply the Nigerian Chess Rating System with variable K-factors based on player experience and rating.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="font-medium">Rating System Parameters:</div>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Floor rating of 800 for new players</li>
                <li>K=40 for new players (less than 30 games)</li>
                <li>K=32 for players rated below 2100</li>
                <li>K=24 for players rated 2100-2399</li>
                <li>K=16 for higher-rated players</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            Cancel
          </Button>
          <Button 
            onClick={processRatings} 
            disabled={isProcessing || matchResults.length === 0}
            className="relative"
          >
            {isProcessing ? (
              <>
                <span className="opacity-0">Process Ratings</span>
                <span className="absolute inset-0 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Process Ratings
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TournamentRatingProcessor;
