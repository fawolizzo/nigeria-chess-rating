import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCcw, Upload, UserPlus, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Player, User } from "@/lib/mockData";
import FileUploadButton from "@/components/players/FileUploadButton";
import CreatePlayerDialog from "./CreatePlayerDialog";
import EditPlayerDialog from "./EditPlayerDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { generateUniquePlayerID } from "@/lib/playerDataUtils";
import { 
  getAllPlayers, 
  getAllUsers, 
  addPlayer, 
  updatePlayer 
} from "@/services/mockServices";

interface PlayerManagementProps {
  onPlayerApproval?: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ onPlayerApproval }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<Player[]>([]);
  const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedPlayers, setUploadedPlayers] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const allPlayers = await getAllPlayers();
        setPlayers(allPlayers);
        setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
        setApprovedPlayers(allPlayers.filter(p => p.status === "approved"));
        
        const allUsers = await getAllUsers();
        const pendingOrgUsers = allUsers.filter(
          user => user.role === 'tournament_organizer' && user.status === 'pending'
        );
        setPendingOrganizers(pendingOrgUsers);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load player data.",
          variant: "destructive"
        });
      }
    };
    
    fetchData();
  }, [refreshKey, toast]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshed",
      description: "Data has been refreshed",
    });
  };
  
  const handleCreatePlayer = async (playerData: any) => {
    try {
      // Generate unique NCR ID
      const ncrId = generateUniquePlayerID();
      
      const newPlayer: Player = {
        id: ncrId,
        name: playerData.fullName,
        rating: playerData.rating || 800,
        gender: playerData.gender || 'M',
        state: playerData.state || '',
        city: playerData.city || '',
        gamesPlayed: 0,
        status: playerData.status || 'pending',
        tournamentResults: [],
        ratingHistory: [{
          date: new Date().toISOString(),
          rating: playerData.rating || 800,
          reason: "Initial rating"
        }]
      };
      
      await addPlayer(newPlayer);
      setRefreshKey(prev => prev + 1);
      toast({
        title: "Player Created",
        description: `${playerData.fullName} has been created successfully with ID: ${ncrId}`,
      });
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error",
        description: "Failed to create player.",
        variant: "destructive"
      });
    }
  };
  
  const handleApprovePlayer = async (playerId: string) => {
    try {
      const playerToUpdate = players.find(p => p.id === playerId);
      if (playerToUpdate) {
        const updatedPlayer = {
          ...playerToUpdate,
          status: 'approved' as const
        };
        await updatePlayer(updatedPlayer);
        setRefreshKey(prev => prev + 1);
        toast({
          title: "Player Approved",
          description: "Player has been approved successfully",
          variant: "default",
        });
        
        if (onPlayerApproval) {
          onPlayerApproval();
        }
      }
    } catch (error) {
      console.error("Error approving player:", error);
      toast({
        title: "Error",
        description: "Failed to approve player.",
        variant: "destructive"
      });
    }
  };
  
  const handleRejectPlayer = async (playerId: string) => {
    try {
      const playerToUpdate = players.find(p => p.id === playerId);
      if (playerToUpdate) {
        const updatedPlayer = {
          ...playerToUpdate,
          status: 'rejected' as const
        };
        await updatePlayer(updatedPlayer);
        setRefreshKey(prev => prev + 1);
        toast({
          title: "Player Rejected",
          description: "Player has been rejected",
          variant: "destructive",
        });
        
        if (onPlayerApproval) {
          onPlayerApproval();
        }
      }
    } catch (error) {
      console.error("Error rejecting player:", error);
      toast({
        title: "Error",
        description: "Failed to reject player.",
        variant: "destructive"
      });
    }
  };
  
  const handleFileUpload = async (players: any[]) => {
    try {
      setUploadedPlayers(players);
      setUploadSuccess(true);
      
      const createdPlayers = await Promise.all(players.map(async player => {
        // Generate unique NCR ID for each imported player
        const ncrId = player.id || generateUniquePlayerID();
        
        const newPlayer: Player = {
          id: ncrId,
          name: player.name,
          rating: player.rating || 900,
          gender: player.gender || 'M',
          state: player.state || '',
          city: player.city || '',
          gamesPlayed: 30,
          status: 'approved',
          ratingStatus: 'established',
          tournamentResults: [],
          ratingHistory: [{
            date: new Date().toISOString(),
            rating: player.rating || 900,
            reason: "Initial rating with +100 bonus"
          }]
        };
        
        if (player.title) {
          newPlayer.title = player.title;
        }
        
        if (player.rapidRating) {
          newPlayer.rapidRating = player.rapidRating;
          newPlayer.rapidGamesPlayed = 30;
          newPlayer.rapidRatingStatus = 'established';
          newPlayer.rapidRatingHistory = [{
            date: new Date().toISOString(),
            rating: player.rapidRating,
            reason: "Initial rating with +100 bonus"
          }];
        }
        
        if (player.blitzRating) {
          newPlayer.blitzRating = player.blitzRating;
          newPlayer.blitzGamesPlayed = 30;
          newPlayer.blitzRatingStatus = 'established';
          newPlayer.blitzRatingHistory = [{
            date: new Date().toISOString(),
            rating: player.blitzRating,
            reason: "Initial rating with +100 bonus"
          }];
        }
        
        await addPlayer(newPlayer);
        // console.log("Created player:", newPlayer); // Removed
        
        return newPlayer;
      }));
      
      setRefreshKey(prev => prev + 1);
      
      toast({
        title: "Upload Successful",
        description: `${players.length} players have been uploaded and approved.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Error uploading players:", error);
      toast({
        title: "Error",
        description: "Failed to upload players.",
        variant: "destructive"
      });
    }
  };

  const handleEditPlayer = (player: Player) => {
    setSelectedPlayer(player);
    setIsEditDialogOpen(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Player Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage players and import player data
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Import Players
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Players from Excel</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <FileUploadButton onFileUpload={handleFileUpload} />
                
                {uploadSuccess && (
                  <div className="mt-4">
                    <div className="flex items-center text-green-600 mb-2">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      <span>Upload Successful! {uploadedPlayers.length} players imported.</span>
                    </div>
                    
                    <div className="max-h-60 overflow-y-auto mt-4 border rounded-md">
                      {uploadedPlayers.length > 0 && (
                        <div className="w-full overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>State</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadedPlayers.map((player, index) => (
                                <TableRow key={index}>
                                  <TableCell className="w-1/5">{player.id || "Auto-generated"}</TableCell>
                                  <TableCell className="w-2/5">{player.name}</TableCell>
                                  <TableCell className="w-1/5">{player.rating || "Unrated"}</TableCell>
                                  <TableCell className="w-1/5">{player.state}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          
          <CreatePlayerDialog onPlayerCreated={handleCreatePlayer} />
        </div>
      </div>
      
      {pendingOrganizers.length > 0 && (
        <div className="border rounded-md">
          <div className="p-4 border-b bg-yellow-50">
            <h3 className="text-lg font-medium text-yellow-800">Pending Organizers ({pendingOrganizers.length})</h3>
            <p className="text-sm text-yellow-700">
              The following tournament organizers are waiting for approval
            </p>
          </div>
          
          <div className="p-4">
            {isMobile ? (
              <div className="space-y-4">
                {pendingOrganizers.map(organizer => (
                  <div key={organizer.id} className="border rounded-md p-3">
                    <div className="font-medium">{organizer.fullName}</div>
                    <div className="text-sm text-muted-foreground">{organizer.email}</div>
                    <div className="mt-2 flex space-x-2">
                      <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button size="sm" variant="outline" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingOrganizers.map(organizer => (
                    <TableRow key={organizer.id}>
                      <TableCell className="w-1/4">{organizer.fullName}</TableCell>
                      <TableCell className="w-1/4">{organizer.email}</TableCell>
                      <TableCell className="w-1/4">
                        {new Date(organizer.registrationDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="w-1/4">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100">
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      )}
      
      <div className="border rounded-md">
        <div className="p-4 border-b bg-muted/40">
          <h3 className="text-lg font-medium">Player Database</h3>
        </div>
        
        <div className="p-4">
          <h4 className="font-medium mb-3">Pending Players ({pendingPlayers.length})</h4>
          
          {pendingPlayers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No pending players to approve.</p>
          ) : isMobile ? (
            <div className="space-y-4">
              {pendingPlayers.map(player => (
                <div key={player.id} className="border rounded-md p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {player.id}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>State: {player.state}</div>
                    <div>Rating: {player.rating || "Unrated"}</div>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" 
                      onClick={() => handleApprovePlayer(player.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" 
                      onClick={() => handleRejectPlayer(player.id)}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/5">Name</TableHead>
                    <TableHead className="w-1/5">State</TableHead>
                    <TableHead className="w-1/5">Rating</TableHead>
                    <TableHead className="w-1/5">Status</TableHead>
                    <TableHead className="w-1/5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPlayers.map(player => (
                    <TableRow key={player.id}>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.state}</TableCell>
                      <TableCell>{player.rating || "Unrated"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" 
                            onClick={() => handleApprovePlayer(player.id)}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" 
                            onClick={() => handleRejectPlayer(player.id)}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <h4 className="font-medium mb-3">Approved Players ({approvedPlayers.length})</h4>
          
          {approvedPlayers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No approved players yet.</p>
          ) : isMobile ? (
            <div className="space-y-4">
              {approvedPlayers.slice(0, 5).map(player => (
                <div key={player.id} className="border rounded-md p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {player.id}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>State: {player.state}</div>
                    <div>Rating: {player.rating || "Unrated"}</div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleEditPlayer(player)}>
                    Edit Player
                  </Button>
                </div>
              ))}
              {approvedPlayers.length > 5 && (
                <Button variant="link" className="w-full" asChild>
                  <Link to="/players">View All {approvedPlayers.length} Approved Players</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/5">Name</TableHead>
                    <TableHead className="w-1/5">State</TableHead>
                    <TableHead className="w-1/5">Rating</TableHead>
                    <TableHead className="w-1/5">Status</TableHead>
                    <TableHead className="w-1/5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedPlayers.slice(0, 5).map(player => (
                    <TableRow key={player.id}>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.state}</TableCell>
                      <TableCell>{player.rating || "Unrated"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditPlayer(player)}>
                          Edit Player
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {approvedPlayers.length > 5 && (
                <div className="mt-4 text-center">
                  <Button variant="link" asChild>
                    <Link to="/players">View All {approvedPlayers.length} Approved Players</Link>
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPlayer && (
        <EditPlayerDialog 
          player={selectedPlayer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={() => setRefreshKey(prev => prev + 1)}
        />
      )}
    </div>
  );
};

export default PlayerManagement;
