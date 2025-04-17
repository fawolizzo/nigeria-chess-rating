
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, Clock, List, File, Users } from "lucide-react";
import { Tournament } from "@/lib/mockData";

interface TournamentDashboardCardProps {
  tournament: Tournament;
  onViewDetails: (id: string) => void;
  onManage: (id: string) => void;
}

export function TournamentDashboardCard({
  tournament,
  onViewDetails,
  onManage
}: TournamentDashboardCardProps) {
  const getBadgeStyles = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30";
      case "pending":
        return "bg-nigeria-yellow/10 text-nigeria-yellow-dark border-nigeria-yellow/20 dark:bg-nigeria-yellow/20 dark:text-nigeria-yellow dark:border-nigeria-yellow/30";
      case "ongoing":
        return "bg-nigeria-green/10 text-nigeria-green border-nigeria-green/20 dark:bg-nigeria-green/20 dark:text-nigeria-green-light dark:border-nigeria-green/30";
      case "completed":
        return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
      default:
        return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-800 shadow-card hover:shadow-card-hover transition-shadow">
      <CardHeader className="pb-2 bg-gradient-nigeria-subtle">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{tournament.name}</CardTitle>
          <Badge className={`border ${getBadgeStyles(tournament.status)}`}>
            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-3">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 mr-2 text-nigeria-green/70 dark:text-nigeria-green-light/70" />
            <span>
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-2 text-nigeria-accent/70 dark:text-nigeria-accent-light/70" />
            <span>{tournament.location}, {tournament.city}, {tournament.state}</span>
          </div>
          <div className="flex items-center text-sm">
            <Clock className="h-4 w-4 mr-2 text-blue-500/70 dark:text-blue-400/70" />
            <span>{tournament.timeControl}</span>
          </div>
          <div className="flex items-center text-sm">
            <List className="h-4 w-4 mr-2 text-nigeria-yellow/70 dark:text-nigeria-yellow-light/70" />
            <span>{tournament.rounds} Rounds</span>
          </div>
        </div>
        
        <div className="flex space-x-2 mt-4">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5"
            onClick={() => onViewDetails(tournament.id)}
          >
            <File className="h-4 w-4 mr-2" />
            Details
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-nigeria-green hover:bg-nigeria-green-dark text-white"
            onClick={() => onManage(tournament.id)}
          >
            <Users className="h-4 w-4 mr-2" />
            Manage
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
