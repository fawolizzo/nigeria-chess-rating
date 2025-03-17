
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OrganizerApprovals from "./OrganizerApprovals";
import ApprovedOrganizers from "./ApprovedOrganizers";
import PlayerManagement from "./PlayerManagement";
import { getAllTournaments, getTournamentById } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Calendar, CheckCircle, ChevronsUpDown, CircleAlert, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import TournamentRatingDialog from "./TournamentRatingDialog";
import ProcessedTournamentDetails from "./ProcessedTournamentDetails";
import PendingTournamentApprovals from "./PendingTournamentApprovals";

const OfficerDashboardContent = () => {
  const [activeTab, setActiveTab] = useState("organizers");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [completedTournaments, setCompletedTournaments] = useState<any[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [selectedProcessedTournament, setSelectedProcessedTournament] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load tournament data
    loadTournaments();
    
    // Load pending players
    const players = JSON.parse(localStorage.getItem('players') || '[]');
    const pendingPlayersList = players.filter((player: any) => player.status === 'pending');
    setPendingPlayers(pendingPlayersList);
  }, []);

  const loadTournaments = () => {
    const allTournaments = getAllTournaments();
    
    // Filter completed tournaments that need rating processing
    const completed = allTournaments.filter(
      (t) => t.status === "completed"
    );
    
    // Filter pending tournaments that need approval/rejection
    const pending = allTournaments.filter(
      (t) => t.status === "pending"
    );
    
    // Filter processed tournaments
    const processed = allTournaments.filter(
      (t) => t.status === "processed"
    );
    
    setTournaments(allTournaments);
    setCompletedTournaments(completed);
    setPendingTournaments(pending);
  };

  const handleProcessTournament = (tournamentId: string) => {
    const tournament = getTournamentById(tournamentId);
    if (tournament) {
      setSelectedTournament(tournament);
      setIsRatingDialogOpen(true);
    }
  };

  const handleProcessingComplete = () => {
    // Reload tournaments to reflect changes
    loadTournaments();
  };

  const handleViewProcessedTournament = (tournamentId: string) => {
    const tournament = getTournamentById(tournamentId);
    if (tournament) {
      setSelectedProcessedTournament(tournament);
    }
  };

  const handleViewTournamentDetails = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const handleApprovePendingPlayers = () => {
    if (pendingPlayers.length > 0) {
      setActiveTab("players");
    }
  };

  const handleTournamentApprovalUpdate = () => {
    // Reload tournaments to reflect approval/rejection changes
    loadTournaments();
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="organizers" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Organizers</span>
        </TabsTrigger>
        <TabsTrigger value="tournaments" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Tournaments</span>
          {pendingTournaments.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {pendingTournaments.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="players" className="flex items-center gap-2 relative">
          <Users className="h-4 w-4" />
          <span>Players</span>
          {pendingPlayers.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {pendingPlayers.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="reports" className="flex items-center gap-2">
          <ChevronsUpDown className="h-4 w-4" />
          <span>Reports</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="organizers" className="space-y-8">
        <OrganizerApprovals />
        <ApprovedOrganizers />
      </TabsContent>

      <TabsContent value="tournaments" className="space-y-8">
        {pendingPlayers.length > 0 && (
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Pending Player Approvals</AlertTitle>
            <AlertDescription className="flex justify-between items-center">
              <span>There are {pendingPlayers.length} player(s) waiting for your approval before they can participate in tournaments.</span>
              <Button variant="outline" size="sm" onClick={handleApprovePendingPlayers}>
                Review Players
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Pending Tournament Approvals Section */}
        {pendingTournaments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Pending Tournament Approvals
              </CardTitle>
              <CardDescription>
                {pendingTournaments.length} tournament(s) waiting for your approval/rejection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PendingTournamentApprovals 
                tournaments={pendingTournaments}
                onApprovalUpdate={handleTournamentApprovalUpdate}
              />
            </CardContent>
          </Card>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tournaments to Process */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleAlert className="h-5 w-5 text-yellow-500" />
                Awaiting Rating Processing
              </CardTitle>
              <CardDescription>
                {completedTournaments.length} tournament(s) completed and ready for rating calculation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedTournaments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tournaments waiting for processing
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {completedTournaments.map((tournament) => (
                      <div
                        key={tournament.id}
                        className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium">{tournament.name}</h3>
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                          <div>Location: {tournament.location}, {tournament.city}, {tournament.state}</div>
                          <div>Rounds: {tournament.rounds}</div>
                          <div>Organizer: {tournament.organizerId}</div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTournamentDetails(tournament.id)}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleProcessTournament(tournament.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Process Ratings
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
          
          {/* Processed Tournaments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Processed Tournaments
              </CardTitle>
              <CardDescription>
                Tournaments with ratings calculated and applied
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tournaments.filter(t => t.status === "processed").length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No processed tournaments
                </div>
              ) : (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    {tournaments
                      .filter(t => t.status === "processed")
                      .map((tournament) => (
                        <div
                          key={tournament.id}
                          className="border border-border rounded-lg p-4 hover:bg-accent/5 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{tournament.name}</h3>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-3">
                            <div>Location: {tournament.location}, {tournament.city}, {tournament.state}</div>
                            <div>Processed on: {new Date(tournament.processingDate).toLocaleDateString()}</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProcessedTournament(tournament.id)}
                          >
                            View Results
                          </Button>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="players">
        <PlayerManagement onPlayerApproval={() => {
          // Refresh the pending players count
          const players = JSON.parse(localStorage.getItem('players') || '[]');
          const pendingPlayersList = players.filter((player: any) => player.status === 'pending');
          setPendingPlayers(pendingPlayersList);
        }} />
      </TabsContent>

      <TabsContent value="reports">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rating Reports</CardTitle>
              <CardDescription>
                Generate and view reports for player ratings and tournament statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Report functionality coming soon
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Rating Dialog */}
      <TournamentRatingDialog
        tournament={selectedTournament}
        isOpen={isRatingDialogOpen}
        onOpenChange={setIsRatingDialogOpen}
        onProcessed={handleProcessingComplete}
      />

      {/* Processed Tournament Details Dialog */}
      {selectedProcessedTournament && (
        <ProcessedTournamentDetails
          tournament={selectedProcessedTournament}
          isOpen={!!selectedProcessedTournament}
          onOpenChange={() => setSelectedProcessedTournament(null)}
        />
      )}
    </Tabs>
  );
};

export default OfficerDashboardContent;
