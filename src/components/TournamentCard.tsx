
import React from "react";
import { CalendarIcon, MapPin, Users, Trophy, Clock } from "lucide-react";
import { Tournament } from "@/lib/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/dateUtils";

export interface TournamentCardProps {
  tournament: Tournament;
  onClickView?: () => void;
  onClickEdit?: () => void;
  onClickDelete?: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onClickView,
  onClickEdit,
  onClickDelete,
}) => {
  // Get status color class
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "ongoing":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "completed":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
      case "processed":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      case "rejected":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const getStatus = (status: string) => {
    switch (status) {
      case "upcoming":
        return "Upcoming";
      case "ongoing":
        return "Ongoing";
      case "completed":
        return "Completed";
      case "processed":
        return "Processed";
      case "rejected":
        return "Rejected";
      case "pending":
        return "Pending";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {tournament.name}
          </h3>
          <span
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              getStatusColorClass(tournament.status)
            )}
          >
            {getStatus(tournament.status)}
          </span>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <CalendarIcon className="h-4 w-4 mr-2" />
            <span>
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{tournament.location}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Users className="h-4 w-4 mr-2" />
            <span>{tournament.participants || "0"} Participants</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Trophy className="h-4 w-4 mr-2" />
            <span>{tournament.rounds} Rounds</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4 mr-2" />
            <span>{tournament.timeControl}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {onClickView && (
            <Button 
              variant="default" 
              size="sm"
              onClick={onClickView} 
              className="w-full"
            >
              View
            </Button>
          )}
          {onClickEdit && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClickEdit} 
              className="w-full"
            >
              Edit
            </Button>
          )}
          {onClickDelete && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClickDelete} 
              className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCard;
