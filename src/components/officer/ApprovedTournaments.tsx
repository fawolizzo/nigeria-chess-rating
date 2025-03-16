
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, CalendarCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllTournaments } from "@/lib/mockData";

interface ApprovedTournamentsProps {
  refreshTrigger?: number;
}

const ApprovedTournaments: React.FC<ApprovedTournamentsProps> = ({ refreshTrigger }) => {
  const navigate = useNavigate();
  
  // Get approved (upcoming, ongoing) tournaments
  const approvedTournaments = getAllTournaments().filter(
    tournament => tournament.status === "upcoming" || tournament.status === "ongoing"
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approved Tournaments</CardTitle>
        <CardDescription>
          Tournaments that have been approved and are upcoming or ongoing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {approvedTournaments.length === 0 ? (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <div className="flex justify-center mb-4">
              <CalendarCheck className="h-12 w-12 text-gray-400" />
            </div>
            <p>No approved tournaments found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvedTournaments.map((tournament) => (
              <div 
                key={tournament.id}
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{tournament.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      tournament.status === "upcoming" 
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    }`}>
                      {tournament.status === "upcoming" ? "Upcoming" : "Ongoing"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tournament.startDate).toLocaleDateString()} • {tournament.location}
                  </p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate(`/tournament/${tournament.id}`)}
                  className="flex items-center gap-1"
                >
                  View <ChevronRight size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovedTournaments;
