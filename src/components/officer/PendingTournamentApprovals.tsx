
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
import { updateTournament } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { format, isValid, parseISO } from "date-fns";
import { useDashboard } from "@/contexts/OfficerDashboardContext";

interface PendingTournamentApprovalsProps {
  tournaments: any[];
  onApprovalUpdate: () => void;
}

const PendingTournamentApprovals: React.FC<PendingTournamentApprovalsProps> = ({
  tournaments,
  onApprovalUpdate,
}) => {
  const { toast } = useToast();
  const { refreshDashboard } = useDashboard();
  
  const handleApproveTournament = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      const updatedTournament = {
        ...tournament,
        status: "upcoming"
      };
      
      try {
        // Log before update for debugging
        console.log("Approving tournament:", tournament);
        console.log("Updated tournament data:", updatedTournament);
        
        // Update the tournament in the mock data
        updateTournament(updatedTournament);
        
        // Show success toast
        toast({
          title: "Tournament Approved",
          description: `${tournament.name} has been approved successfully.`,
          variant: "default",
        });
        
        // Refresh the dashboard data
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
        
        // Additional refresh to ensure data consistency across components
        refreshDashboard();
      } catch (error) {
        console.error("Error approving tournament:", error);
        toast({
          title: "Approval Failed",
          description: "There was an error approving the tournament. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const handleRejectTournament = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      const updatedTournament = {
        ...tournament,
        status: "rejected"
      };
      
      try {
        // Log before update for debugging
        console.log("Rejecting tournament:", tournament);
        console.log("Updated tournament data:", updatedTournament);
        
        // Update the tournament in the mock data
        updateTournament(updatedTournament);
        
        // Show rejection toast
        toast({
          title: "Tournament Rejected",
          description: `${tournament.name} has been rejected.`,
          variant: "destructive",
        });
        
        // Refresh the dashboard data
        if (onApprovalUpdate) {
          onApprovalUpdate();
        }
        
        // Additional refresh to ensure data consistency across components
        refreshDashboard();
      } catch (error) {
        console.error("Error rejecting tournament:", error);
        toast({
          title: "Rejection Failed",
          description: "There was an error rejecting the tournament. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Format date helper function - handles both date strings and date objects
  const formatDate = (dateInput: string | Date) => {
    try {
      // If it's already a Date object
      if (dateInput instanceof Date) {
        return isValid(dateInput) ? format(dateInput, "MMM dd, yyyy") : "Invalid date";
      }
      
      // If it's a string that needs parsing
      if (typeof dateInput === 'string') {
        // Handle both formats: ISO strings and yyyy-MM-dd format
        const date = dateInput.includes('T') ? parseISO(dateInput) : new Date(dateInput);
        return isValid(date) ? format(date, "MMM dd, yyyy") : "Invalid date";
      }
      
      return "Unknown date";
    } catch (error) {
      console.error("Error formatting date:", { dateInput });
      return "Invalid date";
    }
  };

  return (
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
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {tournaments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No tournaments waiting for approval
            </div>
          ) : (
            tournaments.map((tournament) => (
              <div
                key={tournament.id}
                className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{tournament.name}</h3>
                </div>
                <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                  <div>
                    <Calendar className="inline-block h-4 w-4 mr-1" />
                    {formatDate(tournament.start_date || tournament.startDate)} - {formatDate(tournament.end_date || tournament.endDate)}
                  </div>
                  <div>Location: {tournament.location}, {tournament.city}, {tournament.state}</div>
                  <div>Rounds: {tournament.rounds}</div>
                  <div>Time Control: {tournament.time_control || tournament.timeControl}</div>
                  <div className="text-xs text-gray-400">Tournament ID: {tournament.id}</div>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRejectTournament(tournament.id)}
                    className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900 dark:hover:bg-red-950 dark:text-red-400"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApproveTournament(tournament.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PendingTournamentApprovals;
