
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Calendar, AlertCircle } from "lucide-react";
import { updateTournament } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { format, isValid, parseISO } from "date-fns";

interface PendingTournamentApprovalsProps {
  tournaments: any[];
  onApprovalUpdate: () => void;
}

const PendingTournamentApprovals: React.FC<PendingTournamentApprovalsProps> = ({
  tournaments,
  onApprovalUpdate,
}) => {
  const handleApproveTournament = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      const updatedTournament = {
        ...tournament,
        status: "upcoming"
      };
      
      updateTournament(updatedTournament);
      
      toast({
        title: "Tournament Approved",
        description: `${tournament.name} has been approved successfully.`,
        variant: "default",
      });
      
      onApprovalUpdate();
    }
  };
  
  const handleRejectTournament = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (tournament) {
      const updatedTournament = {
        ...tournament,
        status: "rejected"
      };
      
      updateTournament(updatedTournament);
      
      toast({
        title: "Tournament Rejected",
        description: `${tournament.name} has been rejected.`,
        variant: "destructive",
      });
      
      onApprovalUpdate();
    }
  };

  // Format date helper function
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, "MMM dd, yyyy");
      } 
      return dateString;
    } catch (error) {
      return dateString;
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
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </div>
                  <div>Location: {tournament.location}, {tournament.city}, {tournament.state}</div>
                  <div>Rounds: {tournament.rounds}</div>
                  <div>Time Control: {tournament.timeControl}</div>
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
