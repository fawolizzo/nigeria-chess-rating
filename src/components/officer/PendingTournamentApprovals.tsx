
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tournament } from "@/lib/mockData";
import { formatDate } from "@/utils/dateUtils";
import { updateTournament } from "@/services/mockServices";

interface PendingTournamentApprovalsProps {
  tournaments: Tournament[];
  onApprovalUpdate: () => void;
}

const PendingTournamentApprovals: React.FC<PendingTournamentApprovalsProps> = ({ 
  tournaments, 
  onApprovalUpdate 
}) => {
  const { toast } = useToast();
  
  const handleApproveTournament = async (tournament: Tournament) => {
    try {
      const updatedTournament = {
        ...tournament,
        status: "approved"
      };
      
      updateTournament(updatedTournament);
      
      toast({
        title: "Tournament Approved",
        description: "The tournament has been approved successfully",
        variant: "default",
      });
      
      onApprovalUpdate();
    } catch (error) {
      console.error("Error approving tournament:", error);
      toast({
        title: "Error",
        description: "Failed to approve tournament",
        variant: "destructive",
      });
    }
  };
  
  const handleRejectTournament = async (tournament: Tournament) => {
    try {
      const updatedTournament = {
        ...tournament,
        status: "rejected"
      };
      
      updateTournament(updatedTournament);
      
      toast({
        title: "Tournament Rejected",
        description: "The tournament has been rejected",
        variant: "destructive",
      });
      
      onApprovalUpdate();
    } catch (error) {
      console.error("Error rejecting tournament:", error);
      toast({
        title: "Error",
        description: "Failed to reject tournament",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold">Pending Tournament Approvals</h2>
          <p className="text-sm text-muted-foreground">
            Tournaments waiting for your approval
          </p>
        </div>
        <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-md p-2 text-sm">
          <AlertTriangle className="h-4 w-4 mr-2" />
          <span>{tournaments.length} pending</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tournaments.map((tournament) => (
          <Card key={tournament.id} className="overflow-hidden">
            <div className="bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">Requires Approval</span>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{tournament.name}</CardTitle>
              <CardDescription>
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="text-sm space-y-1">
                <div>Location: {tournament.location}, {tournament.state}</div>
                <div>Rounds: {tournament.rounds}</div>
                <div>Time Control: {tournament.timeControl || "Standard"}</div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-2 flex gap-2 border-t">
              <Button 
                variant="outline" 
                className="flex-1 bg-green-50 hover:bg-green-100 border-green-200 text-green-700" 
                onClick={() => handleApproveTournament(tournament)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 bg-red-50 hover:bg-red-100 border-red-200 text-red-700" 
                onClick={() => handleRejectTournament(tournament)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </CardFooter>
          </Card>
        ))}
        
        {tournaments.length === 0 && (
          <div className="col-span-full py-8 text-center">
            <p className="text-gray-500">No pending tournaments to approve</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingTournamentApprovals;
