import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, ChevronRight, Calendar } from "lucide-react";
import { Tournament } from "@/lib/mockData";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/dateUtils";
import { getAllTournaments } from "@/services/mockServices";

interface ApprovedTournamentsProps {
  completedTournaments: Tournament[];
  onTournamentProcessed: () => void;
}

const ApprovedTournaments: React.FC<ApprovedTournamentsProps> = ({ 
  completedTournaments, 
  onTournamentProcessed 
}) => {
  const navigate = useNavigate();
  const [isViewAllVisible, setIsViewAllVisible] = useState(true);
  
  const handleNavigateToTournament = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  };
  
  const viewAllTournaments = () => {
    setIsViewAllVisible(false);
    // You can implement viewing all tournaments in a more elaborate way
  };
  
  const displayedTournaments = isViewAllVisible ? completedTournaments.slice(0, 3) : completedTournaments;
  
  if (completedTournaments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Completed Tournaments</CardTitle>
          <CardDescription>There are no completed tournaments to review</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Tournaments that have been completed will appear here</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Completed Tournaments</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedTournaments.map((tournament) => (
          <Card key={tournament.id} className="overflow-hidden">
            <div className="bg-primary/10 px-4 py-2 flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{tournament.category || "Standard"} Tournament</span>
            </div>
            
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{tournament.name}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="pb-2">
              <div className="text-sm">
                <div>Location: {tournament.location}</div>
                <div>Rounds: {tournament.rounds}</div>
                <div>Status: <span className="font-medium text-amber-600">{tournament.status}</span></div>
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <Button variant="outline" className="w-full" 
                onClick={() => handleNavigateToTournament(tournament.id)}>
                View Details <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {isViewAllVisible && completedTournaments.length > 3 && (
        <div className="text-center">
          <Button variant="link" onClick={viewAllTournaments}>
            View all {completedTournaments.length} tournaments
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApprovedTournaments;
