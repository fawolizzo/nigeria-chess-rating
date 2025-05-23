
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Calendar, AlertCircle, Loader2 } from "lucide-react"; // Added Loader2
// import { updateTournament } from "@/lib/mockData"; // Removed mock import
import { Tournament } from "@/lib/mockData"; // Added Tournament type
import { updateTournamentInSupabase } from "@/services/tournamentService"; // Added Supabase service
import { useToast } from "@/hooks/use-toast";
// import { format, isValid, parseISO } from "date-fns"; // Removed local formatDate
import { formatDisplayDate } from "@/utils/dateUtils"; // Import from dateUtils
import { useDashboard } from "@/contexts/officer/OfficerDashboardContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { Textarea } from "@/components/ui/textarea"; // For rejection reason
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"; // For rejection confirmation

interface PendingTournamentApprovalsProps {
  tournaments: Tournament[]; // Changed any[] to Tournament[]
  onApprovalUpdate: () => void;
}

const PendingTournamentApprovals: React.FC<PendingTournamentApprovalsProps> = ({
  tournaments,
  onApprovalUpdate,
}) => {
  const { toast } = useToast();
  const { refreshDashboard } = useDashboard();
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [tournamentToReject, setTournamentToReject] = useState<Tournament | null>(null);
  
  const handleApproveTournament = async (tournamentId: string) => {
    setProcessingIds(prev => [...prev, tournamentId]);
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
      setProcessingIds(prev => prev.filter(id => id !== tournamentId));
      return;
    }

    try {
      logMessage(LogLevel.INFO, 'PendingTournamentApprovals', `Approving tournament: ${tournament.name} (${tournamentId})`);
      const updatedTournament = await updateTournamentInSupabase(tournamentId, { status: "upcoming" });
      
      if (updatedTournament) {
        toast({
          title: "Tournament Approved",
          description: `${tournament.name} has been approved successfully.`,
        });
        onApprovalUpdate(); // Triggers parent (OfficerDashboardTabs) to call refreshDashboard
        // setTimeout(() => refreshDashboard(), 500); // Direct refresh if needed, parent usually handles
      } else {
        throw new Error("Approval failed at service level.");
      }
    } catch (error) {
      console.error("Error approving tournament:", error);
      logMessage(LogLevel.ERROR, 'PendingTournamentApprovals', `Error approving tournament: ${error}`);
      toast({
        title: "Approval Failed",
        description: "There was an error approving the tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== tournamentId));
    }
  };
  
  const openRejectDialog = (tournament: Tournament) => {
    setTournamentToReject(tournament);
    setRejectionReason(""); // Clear previous reason
  };

  const confirmRejectTournament = async () => {
    if (!tournamentToReject) return;
    const tournamentId = tournamentToReject.id;

    setProcessingIds(prev => [...prev, tournamentId]);
    try {
      logMessage(LogLevel.INFO, 'PendingTournamentApprovals', `Rejecting tournament: ${tournamentToReject.name} (${tournamentId})`);
      const updatedTournament = await updateTournamentInSupabase(tournamentId, { 
        status: "rejected", 
        rejectionReason: rejectionReason || undefined // Send undefined if empty
      });

      if (updatedTournament) {
        toast({
          title: "Tournament Rejected",
          description: `${tournamentToReject.name} has been rejected.`,
          variant: "destructive", // Usually default/success for action completion, but destructive if the action itself is a "rejection"
        });
        onApprovalUpdate();
        // setTimeout(() => refreshDashboard(), 500);
      } else {
        throw new Error("Rejection failed at service level.");
      }
    } catch (error) {
      console.error("Error rejecting tournament:", error);
      logMessage(LogLevel.ERROR, 'PendingTournamentApprovals', `Error rejecting tournament: ${error}`);
      toast({
        title: "Rejection Failed",
        description: "There was an error rejecting the tournament. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== tournamentId));
      setTournamentToReject(null); // Close dialog by clearing the state
    }
  };

  // formatDate is now imported from dateUtils

  return (
    <AlertDialog>
      <div>
      {tournaments.length > 0 && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <div>
            <h3 className="font-medium text-amber-700">Pending Tournament Approvals</h3>
            <p className="text-sm text-amber-600">
              {tournaments.length} tournament{tournaments.length !== 1 ? 's' : ''} waiting for your approval
            </p>
          </div>
        </div>
      )}
      
      <ScrollArea className="h-[400px] pr-4"> {/* Consider adjusting height or making it dynamic */}
        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tournaments waiting for approval.
            </div>
          ) : (
            tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{tournament.name}</h3>
                  {/* Add organizer name if available and relevant */}
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                  <div>
                    <Calendar className="inline-block h-4 w-4 mr-1 text-gray-500" />
                    {formatDisplayDate(tournament.startDate)} - {formatDisplayDate(tournament.endDate)}
                  </div>
                  <div>Location: {tournament.location || 'N/A'}, {tournament.city || 'N/A'}, {tournament.state || 'N/A'}</div>
                  <div>Rounds: {tournament.rounds || 'N/A'}</div>
                  <div>Time Control: {tournament.timeControl || 'N/A'}</div>
                  <div className="text-xs text-gray-400 mt-1">Tournament ID: {tournament.id}</div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={processingIds.includes(tournament.id)}
                      onClick={() => openRejectDialog(tournament)}
                      className="text-red-500 border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-red-700 dark:hover:bg-red-950 dark:text-red-400"
                    >
                      {processingIds.includes(tournament.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      {processingIds.includes(tournament.id) ? "Processing..." : "Reject"}
                    </Button>
                  </AlertDialogTrigger>
                  <Button
                    size="sm"
                    disabled={processingIds.includes(tournament.id)}
                    onClick={() => handleApproveTournament(tournament.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {processingIds.includes(tournament.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    {processingIds.includes(tournament.id) ? "Processing..." : "Approve"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {tournamentToReject && (
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Tournament: {tournamentToReject.name}</AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a reason for rejecting this tournament. This reason will be visible to the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Enter rejection reason (optional)"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            className="min-h-[80px]"
          />
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setTournamentToReject(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRejectTournament} className="bg-red-600 hover:bg-red-700">
              Confirm Rejection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </div>
  </AlertDialog>
);
};

export default PendingTournamentApprovals;
