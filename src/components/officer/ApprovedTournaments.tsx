
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, AlertCircle, CheckCircle, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
// import { getAllTournaments, Tournament } from "@/lib/mockData"; // Removed mock import
import { Tournament } from "@/lib/mockData"; // Kept type
import { useDashboard } from "@/contexts/officer/OfficerDashboardContext"; // Added context import
import TournamentRatingDialog from "./TournamentRatingDialog";
import { useToast } from "@/components/ui/use-toast";

interface ApprovedTournamentsProps {
  completedTournaments?: Tournament[];
  onTournamentProcessed?: () => void;
}

const ApprovedTournaments: React.FC<ApprovedTournamentsProps> = ({ 
  completedTournaments,
  onTournamentProcessed 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    completedTournaments: contextCompletedTournaments, 
    // pendingTournaments, // Not typically shown here, but available from context
    // We might want all non-pending tournaments for a broader view
    // For now, let's assume this component primarily shows completed/processed
    // and potentially ongoing/upcoming as per original logic.
    // The prop `completedTournaments` might be a subset passed by OfficerDashboardTabs.
    // Let's use the context data for a more comprehensive list unless a specific subset is intended by the prop.
    loadAllData // To refresh if needed, though onTournamentProcessed should trigger it in parent
  } = useDashboard(); 
  
  const [tournamentsToDisplay, setTournamentsToDisplay] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  
  useEffect(() => {
    // If completedTournaments prop is explicitly passed, use it.
    // Otherwise, derive from context, showing more than just 'completed'.
    if (completedTournaments) {
      setTournamentsToDisplay(completedTournaments);
    } else {
      // This logic can be simplified if OfficerDashboardTabs passes specific lists to specific tab contents.
      // For now, recreating a combined list from context if prop isn't specific.
      // The original logic showed: "completed", "processed", "upcoming", "ongoing"
      // This component is named "ApprovedTournaments" but also handles completed/processed.
      // Let's fetch all from context and filter.
      const allContextTournaments = [
        ...(contextCompletedTournaments || []), 
        // Assuming useDashboard also provides upcoming and ongoing if needed,
        // or we fetch them if this component's scope is broader.
        // For simplicity, if `completedTournaments` prop is not passed,
        // we rely on the context to provide what this component should show.
        // The original fallback was `getAllTournaments().filter(...)`.
        // Let's use contextCompletedTournaments primarily, and consider if it should show more.
        // The name "ApprovedTournaments" might imply it should show 'approved' (upcoming/ongoing) too.
        // The filter in original useEffect was: "completed" || "processed" || "upcoming" || "ongoing"
        // Let's get all tournaments from context and filter them here
        // This requires useDashboard to expose ALL tournaments, or this component to fetch.
        // Given the task, let's assume contextCompletedTournaments is the primary source.
        // If it needs more, the context or parent should provide it.
        // For now, simplifying to just use contextCompletedTournaments if prop is missing.
      ];
       // Filter from context if prop is not provided. This is slightly different from original.
       // The original logic was to show completed, processed, upcoming, ongoing.
       // Let's fetch all tournaments from context and filter.
       // This implies useDashboard() should provide access to *all* tournaments
       // or this component needs to fetch them.
       // For this refactor, let's assume `useDashboard` provides a comprehensive list
       // or this component should be simplified to only show what's passed via `completedTournaments`.
       // Given the existing structure, `OfficerDashboardTabs` passes `completedTournaments` to this.
       // So, the `else` block might only be relevant if this component is used elsewhere without the prop.
       // For now, if `completedTournaments` (prop) is undefined, we might display nothing or what's in context.
       // The original fallback to `getAllTournaments()` is what we are removing.
       // Let's stick to the prop or context.completedTournaments for now.
      setTournamentsToDisplay(contextCompletedTournaments || []);
    }
  }, [completedTournaments, contextCompletedTournaments]);
  
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "processed": return "bg-purple-500";
      case "completed": return "bg-amber-500";
      case "approved": return "bg-green-500";
      case "ongoing": return "bg-blue-500";
      case "upcoming": return "bg-teal-500";
      default: return "bg-gray-500";
    }
  };
  
  const handleProcessRatings = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsRatingDialogOpen(true);
  };
  
  const handleRatingProcessed = () => {
    if (onTournamentProcessed) {
      onTournamentProcessed();
    }
    
    toast({
      title: "Ratings Processed",
      description: "The tournament ratings have been processed successfully.",
    });
  };
  
  const handleViewTournament = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tournaments</CardTitle>
          <CardDescription>
            View and manage completed and processed tournaments. 
            {/* Potentially also approved/upcoming/ongoing if data source changes */}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentsToDisplay.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tournament</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournamentsToDisplay.map(tournament => (
                  <TableRow key={tournament.id}>
                    <TableCell className="font-medium">{tournament.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5" />
                        {tournament.startDate} - {tournament.endDate}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {tournament.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColorClass(tournament.status)}>
                        {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewTournament(tournament.id)}
                        >
                          View
                        </Button>
                        
                        {tournament.status === "completed" && (
                          <Button 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleProcessRatings(tournament)}
                          >
                            <Trophy className="h-4 w-4 mr-1" />
                            Process Ratings
                          </Button>
                        )}
                        
                        {tournament.status === "processed" && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-purple-600 border-purple-200"
                            disabled
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Processed
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-10 flex flex-col items-center justify-center">
              <AlertCircle className="h-8 w-8 text-gray-400 mb-2" />
              <h3 className="text-lg font-medium text-gray-600">No Tournaments</h3>
              <p className="text-gray-500 text-sm mt-1">
                There are no tournaments that require your attention at this time.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {selectedTournament && (
        <TournamentRatingDialog
          tournament={selectedTournament}
          isOpen={isRatingDialogOpen}
          onOpenChange={setIsRatingDialogOpen}
          onProcessed={handleRatingProcessed}
        />
      )}
    </div>
  );
};

export default ApprovedTournaments;
