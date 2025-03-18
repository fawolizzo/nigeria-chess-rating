
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, AlertCircle, CheckCircle, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllTournaments, Tournament } from "@/lib/mockData";
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
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  
  useEffect(() => {
    if (completedTournaments) {
      setTournaments(completedTournaments);
    } else {
      // Load all tournaments and filter by status if no tournaments are provided
      const allTournaments = getAllTournaments();
      const approvedAndCompletedTournaments = allTournaments.filter(
        t => t.status === "completed" || t.status === "processed"
      );
      setTournaments(approvedAndCompletedTournaments);
    }
  }, [completedTournaments]);
  
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
            View and manage approved, completed, and processed tournaments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournaments.length > 0 ? (
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
                {tournaments.map(tournament => (
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
