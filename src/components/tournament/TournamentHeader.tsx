
import React from "react";
import { CheckCircle, CircleAlert, CircleOff, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tournament } from "@/lib/mockData";

interface TournamentHeaderProps {
  tournament: Tournament;
  onToggleRegistration: () => void;
  onStartTournament: () => void;
  onCompleteTournament: () => void;
  canStartTournament: boolean;
}

const TournamentHeader: React.FC<TournamentHeaderProps> = ({
  tournament,
  onToggleRegistration,
  onStartTournament,
  onCompleteTournament,
  canStartTournament
}) => {
  const formattedStartDate = new Date(tournament.startDate).toLocaleDateString('en-NG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const formattedEndDate = new Date(tournament.endDate).toLocaleDateString('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const getStatusBadge = () => {
    switch (tournament.status) {
      case "upcoming":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">Upcoming</Badge>;
      case "ongoing":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">Ongoing</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300">Completed</Badge>;
      case "processed":
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">Ratings Processed</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">Rejected</Badge>;
      case "pending":
        return <Badge className="bg-nigeria-yellow/10 text-nigeria-yellow-dark dark:bg-nigeria-yellow/20 dark:text-nigeria-yellow">Pending Approval</Badge>;
      default:
        return <Badge variant="outline">Draft</Badge>;
    }
  };

  const renderActionButtons = () => {
    if (tournament.status === "upcoming") {
      return (
        <div className="flex gap-2 items-center">
          <Button
            variant={tournament.registrationOpen ? "destructive" : "default"}
            onClick={onToggleRegistration}
          >
            {tournament.registrationOpen ? (
              <>
                <CircleOff className="h-4 w-4 mr-2" />
                Close Registration
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Open Registration
              </>
            )}
          </Button>
          <Button
            onClick={onStartTournament}
            disabled={!canStartTournament}
            className="bg-green-600 hover:bg-green-700"
          >
            <Clock className="h-4 w-4 mr-2" />
            Start Tournament
          </Button>
        </div>
      );
    } else if (tournament.status === "ongoing") {
      return (
        <Button
          onClick={onCompleteTournament}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Tournament
        </Button>
      );
    } else if (tournament.status === "completed") {
      return (
        <div className="flex items-center gap-2">
          <CircleAlert className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Waiting for rating calculation by Rating Officer
          </span>
        </div>
      );
    } else if (tournament.status === "processed") {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Ratings have been processed
          </span>
        </div>
      );
    } else if (tournament.status === "rejected") {
      return (
        <div className="flex items-center gap-2">
          <CircleOff className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Tournament was rejected by Rating Officer
          </span>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>
            {getStatusBadge()}
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-1">
            {formattedStartDate} to {formattedEndDate}
          </p>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-sm">
            <MapPin className="h-4 w-4" />
            <span>{tournament.location}, {tournament.city}, {tournament.state}</span>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          {renderActionButtons()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Control</div>
          <div className="font-semibold mt-1">{tournament.timeControl}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Rounds</div>
          <div className="font-semibold mt-1">{tournament.rounds}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Round</div>
          <div className="font-semibold mt-1">
            {tournament.currentRound || "Not Started"}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Players</div>
          <div className="font-semibold mt-1">
            {tournament.players ? tournament.players.length : 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TournamentHeader;
