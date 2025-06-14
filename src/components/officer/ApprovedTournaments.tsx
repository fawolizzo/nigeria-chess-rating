
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tournament } from "@/lib/mockData";
import { Calendar, MapPin, Users, Trophy, Clock, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TournamentRatingDialog from "./TournamentRatingDialog";
import GenerateReportDialog from "../GenerateReportDialog";

interface ApprovedTournamentsProps {
  completedTournaments: Tournament[];
  onTournamentProcessed: () => void;
}

const ApprovedTournaments: React.FC<ApprovedTournamentsProps> = ({ 
  completedTournaments, 
  onTournamentProcessed 
}) => {
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleProcessRatings = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsRatingDialogOpen(true);
  };

  const handleRatingProcessed = () => {
    setIsRatingDialogOpen(false);
    setSelectedTournament(null);
    onTournamentProcessed();
    toast({
      title: "Ratings Processed",
      description: "Tournament ratings have been successfully processed.",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">Completed</Badge>;
      case "processed":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Processed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (completedTournaments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-md">
        <Trophy className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tournaments yet</h3>
        <p className="text-gray-500 dark:text-gray-400">
          Completed tournaments will appear here for rating processing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Tournament Management</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {completedTournaments.map((tournament) => (
          <div key={tournament.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">{tournament.name}</h3>
              {getStatusBadge(tournament.status)}
            </div>
            
            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                <span>{tournament.start_date} - {tournament.end_date}</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                <span>{tournament.location}</span>
              </div>
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                <span>{tournament.participants} participants</span>
              </div>
              <div className="flex items-center">
                <Trophy className="h-4 w-4 mr-2" />
                <span>{tournament.rounds} rounds</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                <span>{tournament.time_control}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {tournament.status === "completed" && (
                <Button
                  size="sm"
                  onClick={() => handleProcessRatings(tournament)}
                  className="flex-1"
                >
                  Process Ratings
                </Button>
              )}
              
              <GenerateReportDialog 
                tournament={tournament} 
                players={tournament.players || []} 
              />
            </div>
          </div>
        ))}
      </div>

      {selectedTournament && (
        <TournamentRatingDialog
          tournament={selectedTournament}
          isOpen={isRatingDialogOpen}
          onClose={() => setIsRatingDialogOpen(false)}
          onSuccess={handleRatingProcessed}
        />
      )}
    </div>
  );
};

export default ApprovedTournaments;
