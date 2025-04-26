
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Calendar, Users, Clock } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { useEffect } from "react";

export interface OrganizerStatsGridProps {
  tournaments: any[];
  filterTournamentsByStatus: (status: string) => any[];
  nextTournament: any | undefined;
  formatDisplayDate: (dateString: string) => string;
}

export function OrganizerStatsGrid({
  tournaments, filterTournamentsByStatus, nextTournament, formatDisplayDate
}: OrganizerStatsGridProps) {
  
  // Debug monitoring for issues with tournament data
  useEffect(() => {
    console.log("StatsGrid - Tournaments received:", tournaments?.length || 0);
    console.log("StatsGrid - Next tournament:", nextTournament ? nextTournament.name : "None");
    
    // Validate we have valid data structures
    if (!Array.isArray(tournaments)) {
      console.error("StatsGrid Error: tournaments is not an array", tournaments);
    }
    
    if (nextTournament && typeof nextTournament !== 'object') {
      console.error("StatsGrid Error: nextTournament is not an object", nextTournament);
    }
  }, [tournaments, nextTournament]);

  // Get pending count safely
  const pendingCount = Array.isArray(tournaments) 
    ? filterTournamentsByStatus("pending").length 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="border-nigeria-green/10 shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-nigeria-subtle">
          <CardTitle className="text-sm font-medium">Total Tournaments</CardTitle>
          <Calendar className="h-4 w-4 text-nigeria-green dark:text-nigeria-green-light" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Array.isArray(tournaments) ? tournaments.length : 0}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Across all statuses
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-nigeria-yellow/10 shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-nigeria-yellow/5 to-transparent">
          <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
          <Users className="h-4 w-4 text-nigeria-yellow-dark dark:text-nigeria-yellow" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingCount}</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tournaments waiting for approval
          </p>
        </CardContent>
      </Card>
      
      <Card className="border-nigeria-accent/10 shadow-card hover:shadow-card-hover transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 bg-gradient-to-r from-nigeria-accent/5 to-transparent">
          <CardTitle className="text-sm font-medium">Next Tournament</CardTitle>
          <Clock className="h-4 w-4 text-nigeria-accent-dark dark:text-nigeria-accent-light" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {nextTournament
              ? formatDisplayDate(nextTournament.startDate)
              : "None Scheduled"}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {nextTournament ? nextTournament.name : "No upcoming tournaments"}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
