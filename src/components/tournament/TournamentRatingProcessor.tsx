import React, { useState } from "react";
import { Tournament } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { getFromStorage, saveToStorage } from "@/utils/storageUtils";

interface TournamentRatingProcessorProps {
  tournament: Tournament;
  onProcessingComplete: () => void;
}

const TournamentRatingProcessor: React.FC<TournamentRatingProcessorProps> = ({
  tournament,
  onProcessingComplete
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processRatingChanges = async () => {
    if (!tournament.results || tournament.results.length === 0) {
      toast({
        title: "No Results",
        description: "No tournament results found to process.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Get current players from storage
      const players = getFromStorage('players', []);
      const updatedPlayers = [...players];
      
      // Process each result and update ratings
      tournament.results.forEach((result: any) => {
        const whitePlayerIndex = updatedPlayers.findIndex((p: any) => p.id === result.whiteId);
        const blackPlayerIndex = updatedPlayers.findIndex((p: any) => p.id === result.blackId);
        
        if (whitePlayerIndex !== -1 && blackPlayerIndex !== -1) {
          const whitePlayer = updatedPlayers[whitePlayerIndex];
          const blackPlayer = updatedPlayers[blackPlayerIndex];
          
          // Calculate rating changes based on result
          const whiteScore = result.result === "1-0" ? 1 : result.result === "0-1" ? 0 : 0.5;
          const blackScore = 1 - whiteScore;
          
          // Apply rating changes (simplified calculation)
          const ratingChange = calculateRatingChange(whitePlayer.rating, blackPlayer.rating, whiteScore);
          
          updatedPlayers[whitePlayerIndex] = {
            ...whitePlayer,
            rating: Math.max(800, whitePlayer.rating + ratingChange),
            gamesPlayed: (whitePlayer.gamesPlayed || 0) + 1
          };
          
          updatedPlayers[blackPlayerIndex] = {
            ...blackPlayer,
            rating: Math.max(800, blackPlayer.rating - ratingChange),
            gamesPlayed: (blackPlayer.gamesPlayed || 0) + 1
          };
        }
      });
      
      // Save updated players
      saveToStorage('players', updatedPlayers);
      
      // Mark tournament as processed
      const tournaments = getFromStorage('tournaments', []);
      const tournamentIndex = tournaments.findIndex((t: any) => t.id === tournament.id);
      if (tournamentIndex !== -1) {
        tournaments[tournamentIndex] = {
          ...tournaments[tournamentIndex],
          status: 'processed'
        };
        saveToStorage('tournaments', tournaments);
      }
      
      toast({
        title: "Processing Complete",
        description: "Tournament ratings have been processed successfully.",
      });
      
      onProcessingComplete();
      
    } catch (error) {
      console.error('Error processing ratings:', error);
      toast({
        title: "Processing Error",
        description: "Failed to process tournament ratings.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateRatingChange = (playerRating: number, opponentRating: number, score: number): number => {
    const k = 32; // Adjust the K-factor as needed
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
    return Math.round(k * (score - expectedScore));
  };

  return (
    <div>
      {isProcessing ? (
        <div>Processing...</div>
      ) : (
        <button onClick={processRatingChanges}>Process Ratings</button>
      )}
    </div>
  );
};

export default TournamentRatingProcessor;
