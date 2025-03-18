
import React from "react";
import { CheckCircle, CircleAlert, CircleOff, Clock, MapPin, Users, CalendarDays, Award, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tournament } from "@/lib/mockData";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);
  
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
        <div className={cn(
          "flex gap-2 items-center", 
          isMobile && "flex-col w-full"
        )}>
          <Button
            variant={tournament.registrationOpen ? "destructive" : "default"}
            onClick={onToggleRegistration}
            className={cn(isMobile && "w-full")}
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
            className={cn("bg-green-600 hover:bg-green-700", isMobile && "w-full")}
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
          className={cn("bg-blue-600 hover:bg-blue-700", isMobile && "w-full")}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Complete Tournament
        </Button>
      );
    } else if (tournament.status === "completed") {
      return (
        <div className="flex items-center gap-2 p-3 rounded-md bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
          <CircleAlert className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
            Waiting for rating calculation by Rating Officer
          </span>
        </div>
      );
    } else if (tournament.status === "processed") {
      return (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <span className="text-sm font-medium text-green-700 dark:text-green-400">
            Ratings have been processed
          </span>
        </div>
      );
    } else if (tournament.status === "rejected") {
      return (
        <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
          <CircleOff className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-700 dark:text-red-400">
            Tournament was rejected by Rating Officer
            {tournament.rejectionReason && (
              <span className="block mt-1 text-xs">
                Reason: {tournament.rejectionReason}
              </span>
            )}
          </span>
        </div>
      );
    }
    
    return null;
  };

  if (isMobile) {
    return (
      <div className="mb-6 animate-fade-in">
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold">{tournament.name}</h1>
              {getStatusBadge()}
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">
              {formattedStartDate} to {formattedEndDate}
            </p>
            <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{tournament.location}, {tournament.city}, {tournament.state}</span>
            </div>
          </div>
          
          <div className="w-full">
            {renderActionButtons()}
          </div>
        </div>
        
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 flex justify-between items-center mb-2">
            <h3 className="font-medium text-sm">Tournament Details</h3>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-1 h-auto">
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                <span className="sr-only">Toggle details</span>
              </Button>
            </CollapsibleTrigger>
          </div>
          
          <CollapsibleContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Time Control</div>
                <div className="font-semibold mt-1 text-sm">{tournament.timeControl}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Rounds</div>
                <div className="font-semibold mt-1 text-sm">{tournament.rounds}</div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Round</div>
                <div className="font-semibold mt-1 text-sm">
                  {tournament.currentRound || "Not Started"}
                </div>
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-center">
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Players</div>
                <div className="font-semibold mt-1 text-sm">
                  {tournament.players ? tournament.players.length : 0}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  }

  return (
    <div className="mb-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl md:text-3xl font-bold">{tournament.name}</h1>
            {getStatusBadge()}
          </div>
          <div className="flex flex-col md:flex-row md:items-center md:gap-4">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CalendarDays className="h-4 w-4 text-nigeria-green/70" />
              <span>{formattedStartDate} to {formattedEndDate}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
              <MapPin className="h-4 w-4 text-nigeria-accent/70" />
              <span>{tournament.location}, {tournament.city}, {tournament.state}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0">
          {renderActionButtons()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Time Control</div>
          <div className="font-semibold mt-1">{tournament.timeControl}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Rounds</div>
          <div className="font-semibold mt-1">{tournament.rounds}</div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Round</div>
          <div className="font-semibold mt-1">
            {tournament.currentRound || "Not Started"}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm hover:shadow-md transition-shadow">
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
