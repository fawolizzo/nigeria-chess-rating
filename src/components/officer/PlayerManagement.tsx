
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
import { useToast } from "@/components/ui/use-toast";
import { getAllPlayers, createPlayer, approvePlayer, rejectPlayer } from "@/lib/mockData";
import FileUploadButton from "@/components/players/FileUploadButton";
import CreatePlayerDialog from "./CreatePlayerDialog";
import EditPlayerDialog from "./EditPlayerDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";

// Define proper types to match component requirements
interface FileUploadButtonProps {
  onFileUpload: (players: any[]) => void;
}

interface CreatePlayerDialogProps {
  onPlayerCreate: (playerData: any) => void;
}

interface EditPlayerDialogProps {
  playerData: any;
  onPlayerEdit: () => void;
}

const PlayerManagement: React.FC<{ onPlayerApproval?: () => void }> = ({ onPlayerApproval }) => {
  const [players, setPlayers] = useState<any[]>([]);
  const [pendingPlayers, setPendingPlayers] = useState<any[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedPlayers, setUploadedPlayers] = useState<any[]>([]);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const fetchPlayers = () => {
      const allPlayers = getAllPlayers();
      setPlayers(allPlayers);
      setPendingPlayers(allPlayers.filter(p => p.status === "pending"));
      setApprovedPlayers(allPlayers.filter(p => p.status === "approved"));
    };
    
    fetchPlayers();
  }, [refreshKey]);
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshed",
      description: "Player data has been refreshed",
    });
  };
  
  const handleCreatePlayer = (playerData: any) => {
    createPlayer(playerData);
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Player Created",
      description: `${playerData.fullName} has been created successfully.`,
    });
  };
  
  const handleApprovePlayer = (playerId: string) => {
    approvePlayer(playerId);
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Player Approved",
      description: "Player has been approved successfully",
      variant: "default",
    });
    
    if (onPlayerApproval) {
      onPlayerApproval();
    }
  };
  
  const handleRejectPlayer = (playerId: string) => {
    rejectPlayer(playerId);
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Player Rejected",
      description: "Player has been rejected",
      variant: "destructive",
    });
    
    if (onPlayerApproval) {
      onPlayerApproval();
    }
  };
  
  const handleFileUpload = (players: any[]) => {
    setUploadedPlayers(players);
    setUploadSuccess(true);
    
    // Auto-approve the uploaded players
    players.forEach(player => {
      const newPlayer = createPlayer({
        ...player,
        status: "approved",
      });
      console.log("Created player:", newPlayer);
    });
    
    setRefreshKey(prev => prev + 1);
    
    toast({
      title: "Upload Successful",
      description: `${players.length} players have been uploaded and approved.`,
      variant: "default",
    });
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
                                <TableHead>Name</TableHead>
                                <TableHead>Rating</TableHead>
                                <TableHead>State</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {uploadedPlayers.map((player, index) => (
                                <TableRow key={index}>
                                  <TableCell>{player.fullName}</TableCell>
                                  <TableCell>{player.rating || "Unrated"}</TableCell>
                                  <TableCell>{player.state}</TableCell>
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
          
          <CreatePlayerDialog onPlayerCreate={handleCreatePlayer} />
        </div>
      </div>
      
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
                    <div className="font-medium">{player.fullName}</div>
                    <div className="text-sm text-muted-foreground">ID: {player.id.slice(0, 8)}</div>
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
                    <TableHead>Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPlayers.map(player => (
                    <TableRow key={player.id}>
                      <TableCell>{player.fullName}</TableCell>
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
                    <div className="font-medium">{player.fullName}</div>
                    <div className="text-sm text-muted-foreground">ID: {player.id.slice(0, 8)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>State: {player.state}</div>
                    <div>Rating: {player.rating || "Unrated"}</div>
                  </div>
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
                    <TableHead>Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedPlayers.slice(0, 5).map(player => (
                    <TableRow key={player.id}>
                      <TableCell>{player.fullName}</TableCell>
                      <TableCell>{player.state}</TableCell>
                      <TableCell>{player.rating || "Unrated"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Approved
                        </span>
                      </TableCell>
                      <TableCell>
                        <EditPlayerDialog playerData={player} onPlayerEdit={() => setRefreshKey(prev => prev + 1)} />
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
    </div>
  );
};

export default PlayerManagement;
