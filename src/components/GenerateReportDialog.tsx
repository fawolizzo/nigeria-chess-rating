
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
// import { 
//   updatePlayer, 
//   updateTournament, 
//   getPlayersByTournamentId, 
//   getAllPlayers, 
//   Player,
//   Tournament
// } from "@/lib/mockData"; // Removed mockData imports
import { Player, Tournament } from "@/lib/mockData"; // Kept types
import { 
  getAllPlayersFromSupabase, 
  updatePlayerInSupabase 
} from "@/services/playerService"; // Added player services
import { updateTournamentInSupabase } from "@/services/tournamentService"; // Added tournament service
import { useToast } from "@/components/ui/use-toast";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react"; // Added Loader2
import { FLOOR_RATING } from "@/lib/ratingCalculation";

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

  if (!tournament) return null;

  const handleGenerateReport = async () => {
    if (!tournament || !tournament.players || tournament.players.length === 0) {
      toast({
        title: "No Players",
        description: "This tournament has no players to process.",
        variant: "destructive",
      });
      return;
    }
    setIsGenerating(true);
    
    try {
      const allPlayers = await getAllPlayersFromSupabase({});
      const tournamentPlayerIds = new Set(tournament.players);
      const participatingPlayers = allPlayers.filter(p => tournamentPlayerIds.has(p.id));

      if (participatingPlayers.length === 0) {
          toast({ title: "No Matching Players", description: "Could not find details for participating players.", variant: "destructive" });
          setIsGenerating(false);
          return;
      }

      for (const player of participatingPlayers) {
        const tournamentResult = player.tournamentResults?.find(
          result => result.tournamentId === tournament.id
        );

        if (tournamentResult && typeof tournamentResult.ratingChange === 'number') {
          const ratingChange = tournamentResult.ratingChange;
          const updatedPlayerFields: Partial<Player> = {};
          const today = new Date().toISOString().split('T')[0];
          let currentRating: number;
          let gamesPlayedField: keyof Player;
          let ratingField: keyof Player;
          let historyField: keyof Player;
          let statusField: keyof Player;

          switch (tournament.category) {
            case 'rapid':
              currentRating = player.rapidRating ?? FLOOR_RATING;
              gamesPlayedField = 'rapidGamesPlayed';
              ratingField = 'rapidRating';
              historyField = 'rapidRatingHistory';
              statusField = 'rapidRatingStatus';
              break;
            case 'blitz':
              currentRating = player.blitzRating ?? FLOOR_RATING;
              gamesPlayedField = 'blitzGamesPlayed';
              ratingField = 'blitzRating';
              historyField = 'blitzRatingHistory';
              statusField = 'blitzRatingStatus';
              break;
            default: // classical
              currentRating = player.rating;
              gamesPlayedField = 'gamesPlayed';
              ratingField = 'rating';
              historyField = 'ratingHistory';
              statusField = 'ratingStatus';
              break;
          }

          const newRating = currentRating + ratingChange;
          updatedPlayerFields[ratingField] = newRating;
          
          const currentGamesPlayed = (player[gamesPlayedField] as number | undefined) ?? 0;
          updatedPlayerFields[gamesPlayedField] = currentGamesPlayed + (tournamentResult.gamesPlayed ?? 1); // Assume 1 game if not specified

          const newGamesPlayedTotal = updatedPlayerFields[gamesPlayedField] as number;
          if (newGamesPlayedTotal >= 30 && (player[statusField] === 'provisional' || !player[statusField])) {
            updatedPlayerFields[statusField] = 'established';
          }
          
          const currentHistory = (player[historyField] as Player['ratingHistory'] | undefined) ?? [];
          updatedPlayerFields[historyField] = [
            ...currentHistory,
            { date: today, rating: newRating, reason: `Tournament: ${tournament.name}` }
          ];
          
          // Add tournament result if not already present (idempotency)
          const existingTr = player.tournamentResults?.find(tr => tr.tournamentId === tournament.id);
          if(existingTr) { // Update existing one if needed, or ensure it's correct
            existingTr.ratingChange = ratingChange; // Ensure ratingChange is up-to-date
            // other fields like position, score could be updated here if available from tournamentResult
          } else {
             updatedPlayerFields.tournamentResults = [
                ...(player.tournamentResults || []),
                {
                    tournamentId: tournament.id,
                    tournamentName: tournament.name,
                    format: tournament.category || 'classical',
                    date: today,
                    position: tournamentResult.position, // Assuming position is on tournamentResult
                    ratingChange: ratingChange,
                    score: tournamentResult.score,
                    gamesPlayed: tournamentResult.gamesPlayed
                }
             ];
          }


          if (Object.keys(updatedPlayerFields).length > 0) {
            await updatePlayerInSupabase(player.id, updatedPlayerFields);
          }
        }
      }
      
      await updateTournamentInSupabase(tournament.id, { status: 'processed' });

      toast({
        title: "Report Generated Successfully",
        description: `${tournament.category || 'Classical'} ratings updated for ${tournament.name}.`,
      });
      onReportGenerated();
      onOpenChange(false);

    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error Generating Report",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
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
            This dialog is a placeholder. Actual rating processing is done via "Process Ratings" dialog by Rating Officer.
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
                <li>Player {tournament.category || 'classical'} ratings will be updated based on their results.</li>
                <li>{tournament.category || 'Classical'} rating history will be updated with new entries.</li>
                <li>Tournament status will change to "Processed".</li>
                <li>New players without {tournament.category || 'classical'} ratings will start at {FLOOR_RATING}.</li>
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
            disabled={isGenerating || tournament.status === 'processed'} // Disable if already processed
            className="relative bg-blue-600 hover:bg-blue-700" // Changed color for differentiation
          >
            {isGenerating ? (
              <Loader2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Generate & Finalize Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateReportDialog;
