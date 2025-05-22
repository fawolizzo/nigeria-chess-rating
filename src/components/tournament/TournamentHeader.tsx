
import React from "react";
import { Button } from "@/components/ui/button";
import { CalendarCheck, CalendarClock, CheckCircle, UserPlus } from "lucide-react";
import { Tournament } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

interface TournamentHeaderProps {
  tournament: Tournament;
  onToggleRegistration: () => Promise<void>;
  onStartTournament: () => Promise<void>;
  onCompleteTournament: () => Promise<void>;
  canStartTournament: boolean;
  isProcessing: boolean; // Add this field to match the expected prop
}

const TournamentHeader = ({
  tournament,
  onToggleRegistration,
  onStartTournament,
  onCompleteTournament,
  canStartTournament,
  isProcessing,
}: TournamentHeaderProps) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{tournament?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {tournament?.startDate} to {tournament?.endDate} • {tournament?.location}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Different actions based on tournament status */}
          {tournament?.status === "upcoming" && (
            <>
              <Button 
                onClick={onToggleRegistration} 
                variant="outline" 
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                <UserPlus size={16} />
                {tournament.registrationOpen ? "Close Registration" : "Open Registration"}
              </Button>
              
              <Button 
                onClick={onStartTournament} 
                variant="default" 
                disabled={!canStartTournament || isProcessing}
                className="flex items-center gap-2"
              >
                <CalendarClock size={16} />
                Start Tournament
              </Button>
            </>
          )}
          
          {tournament?.status === "ongoing" && (
            <Button 
              onClick={onCompleteTournament} 
              variant="default" 
              disabled={isProcessing}
              className="flex items-center gap-2"
            >
              <CalendarCheck size={16} />
              Complete Tournament
            </Button>
          )}
          
          {tournament?.status === "completed" && (
            <Badge variant="outline" className="py-1.5 px-3 flex items-center gap-2 border-amber-500 text-amber-500">
              <CheckCircle size={16} />
              Completed
            </Badge>
          )}
          
          {tournament?.status === "processed" && (
            <Badge variant="outline" className="py-1.5 px-3 flex items-center gap-2 border-green-500 text-green-500">
              <CheckCircle size={16} />
              Processed
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentHeader;
