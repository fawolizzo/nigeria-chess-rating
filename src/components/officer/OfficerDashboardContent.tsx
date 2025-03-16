
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ChevronRight, CheckCircle2, ShieldCheck, Users, BarChart3, UserPlus, ThumbsUp, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import OrganizerApprovals from "./OrganizerApprovals";
import { getAllTournaments, updateTournament } from "@/lib/mockData";
import TournamentRatingDialog from "./TournamentRatingDialog";
import PlayerManagement from "./PlayerManagement";
import ApprovedOrganizers from "./ApprovedOrganizers";
import ApprovedTournaments from "./ApprovedTournaments";

const OfficerDashboardContent = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("tournament-reviews");
  const [selectedTournament, setSelectedTournament] = useState(null);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Get pending tournaments that need approval
  const pendingTournaments = getAllTournaments().filter(
    tournament => tournament.status === "pending"
  );
  
  // Get completed tournaments that need processing
  const completedTournaments = getAllTournaments().filter(
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
  
  const handleApproveTournament = (tournament) => {
    const updatedTournament = {
      ...tournament,
      status: "upcoming"
    };
    updateTournament(updatedTournament);
    setRefreshTrigger(prev => prev + 1);
  };
  
  const handleRejectTournament = (tournament) => {
    const updatedTournament = {
      ...tournament,
      status: "rejected"
    };
    updateTournament(updatedTournament);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start px-4 pt-4 pb-0 h-auto bg-transparent border-b flex flex-wrap gap-2 mb-0">
          <TabsTrigger value="tournament-reviews" className="flex gap-1 items-center data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <BarChart3 size={16} /> Tournament Reviews
          </TabsTrigger>
          <TabsTrigger value="approved-tournaments" className="flex gap-1 items-center data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <ThumbsUp size={16} /> Approved Tournaments
          </TabsTrigger>
          <TabsTrigger value="organizer-approvals" className="flex gap-1 items-center data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <ShieldCheck size={16} /> Organizer Approvals
          </TabsTrigger>
          <TabsTrigger value="approved-organizers" className="flex gap-1 items-center data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <CheckCircle2 size={16} /> Approved Organizers
          </TabsTrigger>
          <TabsTrigger value="player-management" className="flex gap-1 items-center data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <UserPlus size={16} /> Player Management
          </TabsTrigger>
          <TabsTrigger value="rating-history" className="flex gap-1 items-center data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
            <FileCheck size={16} /> Processed Tournaments
          </TabsTrigger>
        </TabsList>
        
        <div className="p-6">
          <TabsContent value="tournament-reviews" className="m-0">
            <div className="space-y-6">
              {/* Pending Tournament Approvals */}
              <Card>
                <CardHeader>
                  <CardTitle>Pending Tournament Approvals</CardTitle>
                  <CardDescription>
                    Review and approve tournaments created by organizers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pendingTournaments.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No pending tournaments to approve
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
                              {new Date(tournament.startDate).toLocaleDateString()} • {tournament.location}
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
                              onClick={() => handleApproveTournament(tournament)}
                              className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRejectTournament(tournament)}
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Completed Tournaments for Rating Processing */}
              <Card>
                <CardHeader>
                  <CardTitle>Completed Tournaments</CardTitle>
                  <CardDescription>
                    Process ratings for completed tournaments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {completedTournaments.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      No completed tournaments to process
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {completedTournaments.map((tournament) => (
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
                              className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
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
          
          <TabsContent value="approved-tournaments" className="m-0">
            <ApprovedTournaments refreshTrigger={refreshTrigger} />
          </TabsContent>
          
          <TabsContent value="organizer-approvals" className="m-0">
            <OrganizerApprovals />
          </TabsContent>
          
          <TabsContent value="approved-organizers" className="m-0">
            <ApprovedOrganizers />
          </TabsContent>
          
          <TabsContent value="player-management" className="m-0">
            <PlayerManagement />
          </TabsContent>
          
          <TabsContent value="rating-history" className="m-0">
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
        </div>
      </Tabs>
      
      {/* Rating Dialog */}
      <TournamentRatingDialog
        tournament={selectedTournament}
        isOpen={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        onProcessed={handleProcessed}
      />
    </div>
  );
};

export default OfficerDashboardContent;
