import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { PlusCircle, RefreshCcw, Upload, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Player, User } from "@/lib/mockData"; // Kept types
import { 
  getAllPlayersFromSupabase, 
  getUsersFromSupabase, 
  createPlayerInSupabase, 
  updatePlayerInSupabase,
  updateUserInSupabase 
} from "@/services/playerService"; 
import FileUploadButton from "@/components/players/FileUploadButton";
import CreatePlayerDialog from "./CreatePlayerDialog";
import EditPlayerDialog from "./EditPlayerDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlayerManagementProps {
  onPlayerApproval?: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ onPlayerApproval }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<Player[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<Player[]>([]);
  const [pendingOrganizers, setPendingOrganizers] = useState<User[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadedPlayers, setUploadedPlayers] = useState<Player[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  
  const fetchData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const [allPlayersData, pendingOrgUsers] = await Promise.all([
        getAllPlayersFromSupabase({}),
        getUsersFromSupabase({ role: 'tournament_organizer', status: 'pending' })
      ]);
      setPlayers(allPlayersData);
      setPendingPlayers(allPlayersData.filter(p => p.status === "pending"));
      setApprovedPlayers(allPlayersData.filter(p => p.status === "approved"));
      setPendingOrganizers(pendingOrgUsers);
    } catch (error) {
      console.error("Error fetching data for PlayerManagement:", error);
      toast({ title: "Error", description: "Failed to load player or organizer data.", variant: "destructive" });
    } finally {
      setIsLoadingData(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [refreshKey, fetchData]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1); 
    toast({
      title: "Refreshing Data",
      description: "Player and organizer data is being refreshed.",
    });
  };
  
  const handlePlayerCreatedOrEdited = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const handleApprovePlayer = async (playerId: string) => {
    setIsProcessingAction(true);
    try {
      const updatedPlayer = await updatePlayerInSupabase(playerId, { status: 'approved' });
      if (updatedPlayer) {
        setRefreshKey(prev => prev + 1);
        toast({
          title: "Player Approved",
          description: `${updatedPlayer.name} has been approved.`,
        });
        if (onPlayerApproval) onPlayerApproval();
      } else {
        throw new Error("Approval failed at Supabase service level.");
      }
    } catch (error) {
      console.error("Error approving player:", error);
      toast({ title: "Error Approving Player", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  const handleRejectPlayer = async (playerId: string) => {
    setIsProcessingAction(true);
    try {
      const playerToUpdate = players.find(p => p.id === playerId);
      const updatedPlayer = await updatePlayerInSupabase(playerId, { status: 'rejected' });
      if (updatedPlayer) {
        setRefreshKey(prev => prev + 1);
        toast({
          title: "Player Rejected",
          description: `${playerToUpdate?.name || 'Player'} has been rejected.`,
          variant: "destructive", 
        });
        if (onPlayerApproval) onPlayerApproval();
      } else {
        throw new Error("Rejection failed at Supabase service level.");
      }
    } catch (error) {
      console.error("Error rejecting player:", error);
      toast({ title: "Error Rejecting Player", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleApproveOrganizer = async (organizerId: string) => {
    setIsProcessingAction(true);
    try {
      const updatedUser = await updateUserInSupabase(organizerId, { status: 'approved' });
      if (updatedUser) {
        setRefreshKey(prev => prev + 1);
        toast({ title: "Organizer Approved", description: `${updatedUser.fullName} has been approved.` });
      } else {
        throw new Error("Organizer approval failed.");
      }
    } catch (error) {
      toast({ title: "Error Approving Organizer", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRejectOrganizer = async (organizerId: string) => {
    setIsProcessingAction(true);
    try {
      const userToUpdate = pendingOrganizers.find(u => u.id === organizerId);
      const updatedUser = await updateUserInSupabase(organizerId, { status: 'rejected' });
      if (updatedUser) {
        setRefreshKey(prev => prev + 1);
        toast({ title: "Organizer Rejected", description: `${userToUpdate?.fullName || 'Organizer'} has been rejected.`, variant: "destructive" });
      } else {
        throw new Error("Organizer rejection failed.");
      }
    } catch (error) {
      toast({ title: "Error Rejecting Organizer", description: (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessingAction(false);
    }
  };
  
  const handleFileUpload = async (importedFilePlayers: any[]) => {
    setIsProcessingAction(true);
    setUploadedPlayers([]);
    
    const playersToCreateData: Omit<Player, 'id' | 'ratingHistory' | 'tournamentResults'>[] = importedFilePlayers.map(player => {
      const rating = parseInt(player.rating || player.Std, 10) || 800;
      const rapidRating = parseInt(player.rapidRating || player.Rpd, 10) || undefined;
      const blitzRating = parseInt(player.blitzRating || player.Blz, 10) || undefined;

      return {
        name: player.name || player.Players || "Unknown Player",
        title: player.title || player.Title,
        rating: rating,
        rapidRating: rapidRating,
        blitzRating: blitzRating,
        gender: player.gender || 'M',
        state: player.state || player.Fed?.replace(" NGR", "").trim(),
        birthYear: parseInt(player.birthYear || player['B-Year'], 10) || undefined,
        gamesPlayed: 30,
        status: 'approved',
        ratingStatus: 'established',
      };
    });

    let successfulUploads = 0;
    const createdPlayersList: Player[] = [];

    for (const playerData of playersToCreateData) {
      try {
        const createdPlayer = await createPlayerInSupabase(playerData);
        if (createdPlayer) {
          successfulUploads++;
          createdPlayersList.push(createdPlayer);
        }
      } catch (error) {
        console.error("Error creating player during import:", playerData.name, error);
      }
    }
    
    setUploadedPlayers(createdPlayersList);
    setRefreshKey(prev => prev + 1);
    
    if (successfulUploads > 0) {
      toast({
        title: "Upload Processed",
        description: `${successfulUploads} of ${playersToCreateData.length} players successfully imported and approved.`,
        variant: successfulUploads === playersToCreateData.length ? "default" : "warning",
      });
    } else {
      toast({
        title: "Upload Failed",
        description: "No players could be imported. Please check file format and data.",
        variant: "destructive",
      });
    }
    setIsProcessingAction(false);
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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoadingData || isProcessingAction}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" disabled={isProcessingAction || isLoadingData}>
                {isProcessingAction && uploadedPlayers.length === 0 ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Import Players
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Players from Excel</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <FileUploadButton onFileUpload={handleFileUpload} />
                
                    {uploadedPlayers.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center text-green-600 mb-2">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span>Upload Processed! {uploadedPlayers.length} players were created.</span>
                      </div>
                      <div className="max-h-60 overflow-y-auto mt-4 border rounded-md">
                          <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>ID</TableHead>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Rating</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {uploadedPlayers.map((player) => (
                                  <TableRow key={player.id}>
                                    <TableCell className="truncate max-w-[100px]">{player.id}</TableCell>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>{player.rating}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
              </div>
            </DialogContent>
          </Dialog>
          
          <CreatePlayerDialog onSuccess={handlePlayerCreatedOrEdited} /> 
        </div>
      </div>
      
      {isLoadingData ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /> <span className="ml-2 text-muted-foreground">Loading player data...</span></div>
      ) : (
      <>
      {pendingOrganizers.length > 0 && (
        <div className="border rounded-md">
          <div className="p-4 border-b bg-yellow-50 dark:bg-yellow-950">
            <h3 className="text-lg font-medium text-yellow-800 dark:text-yellow-300">Pending Organizers ({pendingOrganizers.length})</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
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
                        <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                          onClick={() => handleApproveOrganizer(organizer.id)} disabled={isProcessingAction}>
                          {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100" 
                          onClick={() => handleRejectOrganizer(organizer.id)} disabled={isProcessingAction}>
                           {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <XCircle className="h-4 w-4 mr-2" />}
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
                        <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                          onClick={() => handleApproveOrganizer(organizer.id)} disabled={isProcessingAction}>
                          {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100" 
                          onClick={() => handleRejectOrganizer(organizer.id)} disabled={isProcessingAction}>
                           {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <XCircle className="h-4 w-4 mr-2" />}
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
                    <div className="text-sm text-muted-foreground">ID: {player.id.substring(0,8)}...</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>State: {player.state || 'N/A'}</div>
                    <div>Rating: {player.rating || "Unrated"}</div>
                  </div>
                  <div className="flex space-x-2 mt-2">
                    <Button size="sm" variant="outline" 
                      onClick={() => handleApprovePlayer(player.id)} disabled={isProcessingAction}>
                      {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" 
                      onClick={() => handleRejectPlayer(player.id)} disabled={isProcessingAction}>
                      {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <XCircle className="h-4 w-4 mr-2" />}
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
                    <TableHead className="w-2/6">Name</TableHead>
                    <TableHead className="w-1/6">State</TableHead>
                    <TableHead className="w-1/6">Rating</TableHead>
                    <TableHead className="w-1/6">Status</TableHead>
                    <TableHead className="w-1/6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPlayers.map(player => (
                    <TableRow key={player.id}>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.state || 'N/A'}</TableCell>
                      <TableCell>{player.rating || "Unrated"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" 
                            onClick={() => handleApprovePlayer(player.id)} disabled={isProcessingAction}>
                            {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <CheckCircle className="h-4 w-4 mr-2" />}
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" 
                            onClick={() => handleRejectPlayer(player.id)} disabled={isProcessingAction}>
                            {isProcessingAction ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <XCircle className="h-4 w-4 mr-2" />}
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
              {approvedPlayers.slice(0, 5).map(player => ( // Show only first 5 on mobile for brevity
                <div key={player.id} className="border rounded-md p-3">
                  <div className="flex justify-between mb-2">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">ID: {player.id.substring(0,8)}...</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>State: {player.state || 'N/A'}</div>
                    <div>Rating: {player.rating || "Unrated"}</div>
                  </div>
                  <Button size="sm" variant="outline" className="mt-2" onClick={() => handleEditPlayer(player)} disabled={isProcessingAction}>
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
                    <TableHead className="w-2/6">Name</TableHead>
                    <TableHead className="w-1/6">State</TableHead>
                    <TableHead className="w-1/6">Rating</TableHead>
                    <TableHead className="w-1/6">Status</TableHead>
                    <TableHead className="w-1/6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedPlayers.slice(0, 5).map(player => ( // Show only first 5 by default
                    <TableRow key={player.id}>
                      <TableCell>{player.name}</TableCell>
                      <TableCell>{player.state || 'N/A'}</TableCell>
                      <TableCell>{player.rating || "Unrated"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => handleEditPlayer(player)} disabled={isProcessingAction}>
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
      </>
      )}

      {selectedPlayer && (
        <EditPlayerDialog 
          player={selectedPlayer}
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handlePlayerCreatedOrEdited} // Changed from setRefreshKey to dedicated handler
        />
      )}
    </div>
  );
};

export default PlayerManagement;
