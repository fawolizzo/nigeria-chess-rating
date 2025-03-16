
import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { getAllPlayers, getAllTournaments, Player, Tournament, updatePlayer, updateTournament } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, User, Users, Award } from "lucide-react";
import OrganizerApprovals from "./OrganizerApprovals";
import PlayerManagement from "./PlayerManagement";
import { useToast } from "@/components/ui/use-toast";

const OfficerDashboardContent: React.FC = () => {
  const { toast } = useToast();
  const { users, currentUser, approveUser, rejectUser } = useUser();
  const [pendingOrganizers, setPendingOrganizers] = useState([]);
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Load pending data
  useEffect(() => {
    // Get pending organizers
    const organizers = users.filter(user => 
      user.role === "tournament_organizer" && user.status === "pending"
    );
    setPendingOrganizers(organizers);
    
    // Get pending players
    const players = getAllPlayers().filter(player => player.status === "pending");
    setPendingPlayers(players);
    
    // Get pending tournaments
    const tournaments = getAllTournaments().filter(tournament => 
      tournament.status === "completed" && !tournament.processingDate
    );
    setPendingTournaments(tournaments);
  }, [users]);
  
  const handleApprovePlayer = (playerId: string) => {
    const player = getAllPlayers().find(p => p.id === playerId);
    if (player) {
      const updatedPlayer = {
        ...player,
        status: "approved" as const
      };
      updatePlayer(updatedPlayer);
      
      toast({
        title: "Player approved",
        description: `${player.name} has been approved and can now participate in tournaments.`
      });
      
      // Refresh the pending players list
      const players = getAllPlayers().filter(player => player.status === "pending");
      setPendingPlayers(players);
    }
  };
  
  const handleRejectPlayer = (playerId: string) => {
    const player = getAllPlayers().find(p => p.id === playerId);
    if (player) {
      const updatedPlayer = {
        ...player,
        status: "rejected" as const
      };
      updatePlayer(updatedPlayer);
      
      toast({
        title: "Player rejected",
        description: `${player.name} has been rejected.`
      });
      
      // Refresh the pending players list
      const players = getAllPlayers().filter(player => player.status === "pending");
      setPendingPlayers(players);
    }
  };
  
  return (
    <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 mb-8 p-1">
        <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
        <TabsTrigger value="organizers" className="text-xs md:text-sm">Organizers</TabsTrigger>
        <TabsTrigger value="players" className="text-xs md:text-sm">
          Players
          {pendingPlayers.length > 0 && (
            <Badge className="ml-1 bg-red-500 text-white text-xs">{pendingPlayers.length}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="tournaments" className="text-xs md:text-sm">Tournaments</TabsTrigger>
        <TabsTrigger value="reports" className="text-xs md:text-sm">Reports</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Pending Approvals Card */}
          <Card className={pendingPlayers.length > 0 ? "border-yellow-300 dark:border-yellow-800" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Player Approvals
              </CardTitle>
              <CardDescription>
                {pendingPlayers.length} player(s) pending approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPlayers.length > 0 ? (
                <div className="space-y-3">
                  {pendingPlayers.slice(0, 3).map(player => (
                    <div key={player.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div>
                        <p className="font-medium">
                          {player.title && <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>}
                          {player.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Rating: {player.rating} • {player.state || "Nigeria"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600">Pending</Badge>
                    </div>
                  ))}
                  
                  {pendingPlayers.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{pendingPlayers.length - 3} more pending player(s)
                    </p>
                  )}
                  
                  <Button
                    className="w-full mt-2" 
                    variant="outline"
                    onClick={() => setActiveTab("players")}
                  >
                    Manage Player Approvals
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground text-center">No players pending approval</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pending Tournaments Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                Tournament Processing
              </CardTitle>
              <CardDescription>
                {pendingTournaments.length} tournament(s) to process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingTournaments.length > 0 ? (
                <div className="space-y-3">
                  {pendingTournaments.slice(0, 3).map(tournament => (
                    <div key={tournament.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div>
                        <p className="font-medium">{tournament.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {tournament.participants} players • {tournament.state}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-blue-50 text-blue-600">Completed</Badge>
                    </div>
                  ))}
                  
                  {pendingTournaments.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{pendingTournaments.length - 3} more tournament(s)
                    </p>
                  )}
                  
                  <Button
                    className="w-full mt-2" 
                    variant="outline"
                    onClick={() => setActiveTab("tournaments")}
                  >
                    View Tournaments
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground text-center">No tournaments pending processing</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pending Organizers Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Organizer Approvals
              </CardTitle>
              <CardDescription>
                {pendingOrganizers.length} organizer(s) pending approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingOrganizers.length > 0 ? (
                <div className="space-y-3">
                  {pendingOrganizers.slice(0, 3).map(organizer => (
                    <div key={organizer.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                      <div>
                        <p className="font-medium">{organizer.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {organizer.state || "Nigeria"}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600">Pending</Badge>
                    </div>
                  ))}
                  
                  {pendingOrganizers.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      +{pendingOrganizers.length - 3} more organizer(s)
                    </p>
                  )}
                  
                  <Button
                    className="w-full mt-2" 
                    variant="outline"
                    onClick={() => setActiveTab("organizers")}
                  >
                    Manage Organizer Approvals
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6">
                  <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-muted-foreground text-center">No organizers pending approval</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest events and activities in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* This would be populated with actual activity in a real application */}
              <div className="border-l-4 border-blue-500 pl-4 py-1">
                <p className="font-medium">System Initialized</p>
                <p className="text-sm text-muted-foreground">Nigerian Chess Rating system is now active.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="organizers">
        <OrganizerApprovals />
      </TabsContent>
      
      <TabsContent value="players">
        {pendingPlayers.length > 0 ? (
          <Card className="border-yellow-300 dark:border-yellow-800">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    Players Pending Approval
                  </CardTitle>
                  <CardDescription>{pendingPlayers.length} players waiting for approval</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingPlayers.map(player => (
                  <div key={player.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-lg">
                          {player.title && <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>}
                          {player.name}
                        </h3>
                        <div className="flex gap-3 text-sm text-muted-foreground">
                          <span>Rating: {player.rating}</span>
                          {player.state && <span>• {player.state}</span>}
                          <span>• {player.gender === 'M' ? 'Male' : 'Female'}</span>
                          {player.birthYear && <span>• Born: {player.birthYear}</span>}
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                        Pending
                      </Badge>
                    </div>
                    
                    <div className="flex justify-end gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                        onClick={() => handleRejectPlayer(player.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprovePlayer(player.id)}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pending Player Approvals</CardTitle>
              <CardDescription>No players waiting for approval</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-lg font-medium text-center mb-2">All player applications have been processed</p>
                <p className="text-muted-foreground text-center max-w-md">
                  When tournament organizers register new players, they will appear here for your approval.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="mt-8">
          <PlayerManagement />
        </div>
      </TabsContent>
      
      <TabsContent value="tournaments">
        <Card>
          <CardHeader>
            <CardTitle>Tournament Management</CardTitle>
            <CardDescription>Process completed tournaments and update player ratings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-10">
              Tournament management interface would be shown here.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Reports & Statistics</CardTitle>
            <CardDescription>View system-wide statistics and generate reports</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center py-10">
              Reports and statistics would be shown here.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default OfficerDashboardContent;
