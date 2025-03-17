
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Pencil, Plus, Search, UserCheck, UserX } from "lucide-react";
import { getAllPlayers, updatePlayer } from "@/lib/mockData";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import CreatePlayerDialog from "./CreatePlayerDialog";
import EditPlayerDialog from "./EditPlayerDialog";

interface PlayerManagementProps {
  onPlayerApproval?: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ onPlayerApproval }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<any>(null);
  
  useEffect(() => {
    loadPlayers();
  }, []);
  
  const loadPlayers = () => {
    const allPlayers = getAllPlayers();
    setPlayers(allPlayers);
    
    // Filter pending players
    const pending = allPlayers.filter(player => player.status === 'pending');
    setPendingPlayers(pending);
    
    // Filter approved players
    const approved = allPlayers.filter(player => player.status === 'approved');
    setApprovedPlayers(approved);
  };
  
  const handleApprovePlayer = (playerId: string) => {
    // Find player in the list
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Update player status to approved
    const updatedPlayer = {
      ...player,
      status: 'approved',
      approvalDate: new Date().toISOString()
    };
    
    // Update player in system
    updatePlayer(updatedPlayer);
    
    // Reload players
    loadPlayers();
    
    toast({
      title: "Player Approved",
      description: `${player.name} has been approved and can now participate in tournaments.`
    });
    
    // Call the callback if provided
    if (onPlayerApproval) {
      onPlayerApproval();
    }
  };
  
  const handleRejectPlayer = (playerId: string) => {
    // Find player in the list
    const player = players.find(p => p.id === playerId);
    if (!player) return;
    
    // Update player status to rejected
    const updatedPlayer = {
      ...player,
      status: 'rejected',
      rejectionDate: new Date().toISOString()
    };
    
    // Update player in system
    updatePlayer(updatedPlayer);
    
    // Reload players
    loadPlayers();
    
    toast({
      title: "Player Rejected",
      description: `${player.name} has been rejected and cannot participate in tournaments.`,
      variant: "destructive"
    });
    
    // Call the callback if provided
    if (onPlayerApproval) {
      onPlayerApproval();
    }
  };
  
  const handleEditPlayer = (player: any) => {
    setEditingPlayer(player);
  };
  
  const handlePlayerEdited = () => {
    setEditingPlayer(null);
    loadPlayers();
    
    toast({
      title: "Player Updated",
      description: "Player information has been updated successfully."
    });
  };
  
  const handlePlayerCreated = () => {
    loadPlayers();
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Player Created",
      description: "New player has been created successfully."
    });
  };
  
  const filteredApprovedPlayers = approvedPlayers.filter(player => 
    player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    player.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (player.city && player.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  return (
    <div>
      <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Player Management</h2>
          <p className="text-muted-foreground">Manage player registrations and approvals</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Player
        </Button>
      </div>
      
      <Tabs defaultValue={pendingPlayers.length > 0 ? "pending" : "approved"} className="space-y-4">
        <TabsList>
          <TabsTrigger 
            value="pending" 
            className="relative"
          >
            Pending Approval
            {pendingPlayers.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 text-xs font-medium">
                {pendingPlayers.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved Players
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Players</CardTitle>
              <CardDescription>
                Players waiting for approval to participate in tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingPlayers.length === 0 ? (
                <div className="text-center py-10">
                  <UserCheck className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No Pending Players
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    All player registrations have been processed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPlayers.map(player => (
                    <div 
                      key={player.id} 
                      className="border border-gray-200 dark:border-gray-800 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-medium text-lg flex items-center gap-2">
                            {player.name}
                          </h3>
                          <p className="text-muted-foreground">
                            Rating: {player.rating} • {player.state}
                            {player.city && `, ${player.city}`}
                          </p>
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
                          Pending
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleRejectPlayer(player.id)}
                        >
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprovePlayer(player.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="approved">
          <Card>
            <CardHeader>
              <CardTitle>Approved Players</CardTitle>
              <CardDescription>
                Manage all players who have been approved to participate in tournaments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
                  <Input
                    type="search"
                    placeholder="Search players by name, state or city..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {filteredApprovedPlayers.length === 0 ? (
                <div className="text-center py-10">
                  <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
                    No Players Found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchQuery
                      ? "Try adjusting your search query"
                      : "No approved players in the system yet"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredApprovedPlayers.map(player => (
                    <div
                      key={player.id}
                      className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium flex items-center gap-2">
                            {player.name}
                            <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approved
                            </Badge>
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            Rating: {player.rating} • Games: {player.gamesPlayed || 0}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {player.state}{player.city && `, ${player.city}`}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditPlayer(player)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Create Player Dialog */}
      <CreatePlayerDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onPlayerCreated={handlePlayerCreated}
      />
      
      {/* Edit Player Dialog */}
      {editingPlayer && (
        <EditPlayerDialog
          isOpen={!!editingPlayer}
          onOpenChange={() => setEditingPlayer(null)}
          player={editingPlayer}
          onPlayerEdited={handlePlayerEdited}
        />
      )}
    </div>
  );
};

export default PlayerManagement;
