
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TournamentHeaderProps {
  tournament: {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    location: string;
    city: string;
    state: string;
    status: "upcoming" | "ongoing" | "completed" | "pending" | "rejected";
    timeControl: string;
    rounds: number;
    registrationOpen?: boolean;
  };
  onToggleRegistration: () => void;
  onStartTournament: () => void;
  onCompleteTournament: () => void;
  onGenerateReport: () => void;
  canStartTournament: boolean;
  isGeneratingReport: boolean;
}

const TournamentHeader = ({
  tournament,
  onToggleRegistration,
  onStartTournament,
  onCompleteTournament,
  onGenerateReport,
  canStartTournament,
  isGeneratingReport
}: TournamentHeaderProps) => {
  const navigate = useNavigate();

  return (
    <>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-8 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </button>
      
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {tournament.name}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tournament.status === "upcoming" && (
            <>
              <Button
                onClick={onToggleRegistration}
                variant="outline"
                className="flex-1 sm:flex-none"
              >
                {tournament.registrationOpen ? "Close Registration" : "Open Registration"}
              </Button>
              
              <Button
                onClick={onStartTournament}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
                disabled={!canStartTournament}
              >
                Start Tournament
              </Button>
            </>
          )}
          
          {tournament.status === "ongoing" && (
            <Button
              onClick={onCompleteTournament}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            >
              Mark as Completed
            </Button>
          )}
          
          {tournament.status === "completed" && (
            <Button
              onClick={onGenerateReport}
              className="flex-1 sm:flex-none flex items-center gap-2"
              variant="outline"
              disabled={isGeneratingReport}
            >
              <FileDown size={16} /> 
              {isGeneratingReport ? "Generating..." : "Export Report"}
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-6">
        <Badge className={
          tournament.status === "upcoming" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300" :
          tournament.status === "ongoing" ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" :
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
        }>
          {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
        </Badge>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tournament.rounds} rounds
        </span>
        
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {tournament.timeControl}
        </span>
      </div>
    </>
  );
};

export default TournamentHeader;
