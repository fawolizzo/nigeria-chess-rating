import { useState } from "react";
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
import { AlertTriangle, CheckCircle } from "lucide-react";
import { Player, Tournament } from "@/lib/mockData"; // Only import types
import { FLOOR_RATING } from "@/lib/ratingCalculation";
import { getAllPlayersFromSupabase, updatePlayerInSupabase } from "@/services/playerService";
import { updateTournamentInSupabase } from "@/services/tournamentService";

interface GenerateReportDialogProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onReportGenerated: () => void;
}

const GenerateReportDialog = ({ 
  tournament, 
  isOpen, 
  onOpenChange,
  onReportGenerated
}: GenerateReportDialogProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tournamentPlayers, setTournamentPlayers] = useState<Player[]>([]);

  if (!tournament) return null;

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    
    try {
      // Get players that participated in this tournament from Supabase
      const allPlayers = await getAllPlayersFromSupabase({});
      
      // Filter players for this tournament
      const tournamentParticipantIds = tournament.players || [];
      const tournamentPlayers = allPlayers.filter(player => 
        tournamentParticipantIds.includes(player.id)
      );
      
      // Process each player in parallel
      await Promise.all(tournamentPlayers.map(async (player) => {
        const tournamentResult = player.tournamentResults?.find(
          result => result.tournamentId === tournament.id
        );
        
        if (tournamentResult) {
          const ratingChange = tournamentResult.ratingChange;
          
          // Get the appropriate rating based on tournament category
          const getCurrentRating = () => {
            if (tournament.category === 'rapid') {
              return player.rapidRating !== undefined ? player.rapidRating : FLOOR_RATING;
            } else if (tournament.category === 'blitz') {
              return player.blitzRating !== undefined ? player.blitzRating : FLOOR_RATING;
            }
            return player.rating;
          };
          
          const currentRating = getCurrentRating();
          const newRating = currentRating + ratingChange;
          
          // Update player's appropriate rating type
          let updatedPlayerFields: Partial<Player> = {};
          const today = new Date().toISOString().split('T')[0];
          
          if (tournament.category === 'rapid') {
            updatedPlayerFields = {
              rapidRating: newRating,
              rapidGamesPlayed: (player.rapidGamesPlayed ?? 0) + 1,
              rapidRatingHistory: [
                ...(player.rapidRatingHistory || []),
                {
                  date: today,
                  rating: newRating,
                  reason: `Tournament: ${tournament.name}`
                }
              ]
            };
            
            // Update rating status if needed
            if ((player.rapidGamesPlayed ?? 0) + 1 >= 30 && (!player.rapidRatingStatus || player.rapidRatingStatus === 'provisional')) {
              updatedPlayerFields.rapidRatingStatus = 'established';
            }
          } else if (tournament.category === 'blitz') {
            updatedPlayerFields = {
              blitzRating: newRating,
              blitzGamesPlayed: (player.blitzGamesPlayed ?? 0) + 1,
              blitzRatingHistory: [
                ...(player.blitzRatingHistory || []),
                {
                  date: today,
                  rating: newRating,
                  reason: `Tournament: ${tournament.name}`
                }
              ]
            };
            
            // Update rating status if needed
            if ((player.blitzGamesPlayed ?? 0) + 1 >= 30 && (!player.blitzRatingStatus || player.blitzRatingStatus === 'provisional')) {
              updatedPlayerFields.blitzRatingStatus = 'established';
            }
          } else {
            // Default to classical
            updatedPlayerFields = {
              rating: newRating,
              gamesPlayed: (player.gamesPlayed || 0) + 1,
              ratingHistory: [
                ...(player.ratingHistory || []),
                {
                  date: today,
                  rating: newRating,
                  reason: `Tournament: ${tournament.name}`
                }
              ]
            };
            
            // Update rating status if needed
            if ((player.gamesPlayed || 0) + 1 >= 30 && (!player.ratingStatus || player.ratingStatus === 'provisional')) {
              updatedPlayerFields.ratingStatus = 'established';
            }
          }
          
          // Update player in Supabase
          await updatePlayerInSupabase(player.id, updatedPlayerFields);
        }
      }));
      
      // Mark tournament as processed
      await updateTournamentInSupabase(tournament.id, {
        status: 'processed' as Tournament['status'],
        processingDate: new Date().toISOString()
      });
      
      // Complete the generation process
      setTimeout(() => {
        setIsGenerating(false);
        onOpenChange(false);
        onReportGenerated();
        
        toast({
          title: "Report Generated",
          description: `${tournament.category || 'Classical'} ratings have been updated for all players in ${tournament.name}`,
          duration: 5000,
        });
      }, 1500);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Processing Tournament",
        description: "Failed to process tournament results. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Tournament Report</DialogTitle>
          <DialogDescription>
            This will process the results of {tournament.name} and update all participating players' {tournament.category || 'classical'} ratings accordingly.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 rounded-md">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">This action is irreversible</p>
                <p className="text-sm mt-1">
                  Player {tournament.category || 'classical'} ratings will be permanently updated based on their tournament results.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="font-medium">The following changes will occur:</div>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>Player {tournament.category || 'classical'} ratings will be updated based on their results</li>
                <li>{tournament.category || 'Classical'} rating history will be updated with new entries</li>
                <li>Tournament status will change to "Processed"</li>
                <li>New players without {tournament.category || 'classical'} ratings will start at {FLOOR_RATING}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateReport} 
            disabled={isGenerating}
            className="relative"
          >
            {isGenerating ? (
              <>
                <span className="opacity-0">Generate Report</span>
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
                Generate Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportDialog;
