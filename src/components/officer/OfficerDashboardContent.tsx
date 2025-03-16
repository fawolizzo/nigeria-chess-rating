
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, ShieldCheck, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrganizerApprovals from "./OrganizerApprovals";
import { getAllTournaments } from "@/lib/mockData";
import TournamentRatingDialog from "./TournamentRatingDialog";

const OfficerDashboardContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tournament-reviews");
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get completed tournaments that need processing
  const pendingTournaments = getAllTournaments().filter(
    tournament => tournament.status === "completed"
  );
  
  // Get processed tournaments
  const processedTournaments = getAllTournaments().filter(
    tournament => tournament.status === "processed"
  );
  
  const handleProcessTournament = (tournament) => {
    setSelectedTournament(tournament);
    setIsRatingDialogOpen(true);
  };
  
  const handleProcessed = () => {
    // Refresh the tournament lists
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="mb-8">
        <TabsTrigger value="tournament-reviews" className="flex gap-1 items-center">
          <BarChart3 size={16} /> Tournament Reviews
        </TabsTrigger>
        <TabsTrigger value="organizer-approvals" className="flex gap-1 items-center">
          <ShieldCheck size={16} /> Organizer Approvals
        </TabsTrigger>
        <TabsTrigger value="rating-history" className="flex gap-1 items-center">
          <CheckCircle2 size={16} /> Processed Tournaments
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="tournament-reviews">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tournament Reviews</CardTitle>
              <CardDescription>
                Review and process ratings for completed tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTournaments.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No pending tournaments to review
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTournaments.map((tournament) => (
                    <div 
                      key={tournament.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                    >
                      <div>
                        <h3 className="font-medium">{tournament.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(tournament.endDate).toLocaleDateString()} • {tournament.location}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate(`/tournament/${tournament.id}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => handleProcessTournament(tournament)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Process Ratings
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      
      <TabsContent value="organizer-approvals">
        <OrganizerApprovals />
      </TabsContent>
      
      <TabsContent value="rating-history">
        <Card>
          <CardHeader>
            <CardTitle>Processed Tournaments</CardTitle>
            <CardDescription>
              Review history of processed tournaments and their rating changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {processedTournaments.length === 0 ? (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No processed tournaments found
              </div>
            ) : (
              <div className="space-y-4">
                {processedTournaments.map((tournament) => (
                  <div 
                    key={tournament.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-800"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{tournament.name}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Processed
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(tournament.endDate).toLocaleDateString()} • {tournament.location}
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
      </TabsContent>
      
      {/* Rating Dialog */}
      <TournamentRatingDialog
        tournament={selectedTournament}
        isOpen={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        onProcessed={handleProcessed}
      />
    </Tabs>
  );
};

export default OfficerDashboardContent;
