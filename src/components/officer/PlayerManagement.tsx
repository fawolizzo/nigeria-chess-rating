import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Check, X, Search, UserPlus, Edit, Upload } from "lucide-react";
import { Player } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import StateSelector from "@/components/selectors/StateSelector";
import CitySelector from "@/components/selectors/CitySelector";
import EditPlayerDialog from "./EditPlayerDialog";
import FileUploadButton from "@/components/players/FileUploadButton";
import { createPlayer, updatePlayerInSupabase, getAllPlayersFromSupabase } from "@/services/playerService";

interface PlayerManagementProps {
  onPlayerApproval: () => void;
}

const PlayerManagement: React.FC<PlayerManagementProps> = ({ onPlayerApproval }) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [isCreatePlayerOpen, setIsCreatePlayerOpen] = useState(false);
  const [isUploadPlayersOpen, setIsUploadPlayersOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const { toast } = useToast();

  // New player form state
  const [newPlayer, setNewPlayer] = useState({
    name: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    gender: "M" as "M" | "F",
    fideId: "",
    title: "" as "" | "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM",
  });

  // Load players from Supabase
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const fetchedPlayers = await getAllPlayersFromSupabase({ status: selectedStatus });
        setPlayers(Array.isArray(fetchedPlayers) ? fetchedPlayers : []);
      } catch (error) {
        console.error('Error loading players:', error);
        setPlayers([]);
      }
    };

    loadPlayers();
    const interval = setInterval(loadPlayers, 5000);
    return () => clearInterval(interval);
  }, [selectedStatus]);

  // Save players to Supabase (handled by create/update functions)

  const handleApproval = async (playerId: string, status: "approved" | "rejected") => {
    try {
      const player = players.find(p => p.id === playerId);
      if (!player) return;
      await updatePlayerInSupabase(playerId, { status });
      onPlayerApproval();
      toast({
        title: status === "approved" ? "Player Approved" : "Player Rejected",
        description: `Player has been ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update player status",
        variant: "destructive",
      });
    }
  };

  const handleCreatePlayer = async () => {
    if (!newPlayer.name || !newPlayer.email) {
      toast({
        title: "Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }
    try {
      // Prepare player data, filtering out empty title
      const playerData = {
        ...newPlayer,
        title: newPlayer.title === "" ? undefined : newPlayer.title
      };
      
      await createPlayer(playerData);
      setNewPlayer({
        name: "",
        email: "",
        phone: "",
        state: "",
        city: "",
        gender: "M",
        fideId: "",
        title: "" as "" | "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM",
      });
      setIsCreatePlayerOpen(false);
      onPlayerApproval();
      toast({
        title: "Player Created",
        description: "New player has been added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create player",
        variant: "destructive",
      });
    }
  };

  const handlePlayersImported = async (importedPlayers: Partial<Player>[]) => {
    console.log('🚀 PlayerManagement: handlePlayersImported called with', importedPlayers.length, 'players');
    
    if (!importedPlayers || importedPlayers.length === 0) {
      console.error('❌ PlayerManagement: No players provided to import');
      toast({
        title: "Import Failed",
        description: "No players were provided for import.",
        variant: "destructive"
      });
      setIsUploadPlayersOpen(false);
      return;
    }

    let addedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Show initial processing toast
    toast({
      title: "Processing Upload",
      description: `Processing ${importedPlayers.length} players...`,
    });

    for (let i = 0; i < importedPlayers.length; i++) {
      const playerData = importedPlayers[i];
      console.log(`🔄 PlayerManagement: Processing player ${i + 1}/${importedPlayers.length}:`, playerData.name);
      
      if (playerData.name && playerData.email) {
        try {
          await createPlayer(playerData);
          addedCount++;
          console.log(`✅ PlayerManagement: Successfully created player ${playerData.name}`);
        } catch (error) {
          errorCount++;
          const errorMsg = `Failed to create player ${playerData.name}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.error(`❌ PlayerManagement: ${errorMsg}`);
        }
      } else {
        errorCount++;
        const errorMsg = `Player ${playerData.name || 'Unknown'} missing required fields (name or email)`;
        errors.push(errorMsg);
        console.error(`❌ PlayerManagement: ${errorMsg}`);
      }
    }

    console.log(`📊 PlayerManagement: Import completed. Added: ${addedCount}, Errors: ${errorCount}`);

    // Always refresh the player list immediately
    try {
      console.log('🔄 PlayerManagement: Refreshing player list...');
      const fetchedPlayers = await getAllPlayersFromSupabase({ status: selectedStatus });
      setPlayers(Array.isArray(fetchedPlayers) ? fetchedPlayers : []);
      console.log('✅ PlayerManagement: Player list refreshed successfully');
    } catch (error) {
      console.error('❌ PlayerManagement: Error refreshing player list:', error);
    }

    // Call the approval callback
    onPlayerApproval();

    // Close modal immediately
    setIsUploadPlayersOpen(false);
    console.log('✅ PlayerManagement: Modal closed');

    // Show appropriate toast message
    if (addedCount > 0 && errorCount === 0) {
      toast({
        title: "✅ Upload Successful",
        description: `Successfully imported ${addedCount} players.`,
      });
      console.log('✅ PlayerManagement: Success toast shown');
    } else if (addedCount > 0 && errorCount > 0) {
      toast({
        title: "⚠️ Partial Success",
        description: `Imported ${addedCount} players, ${errorCount} failed. Check console for details.`,
        variant: "destructive"
      });
      console.log('⚠️ PlayerManagement: Partial success toast shown');
      // Log all errors for debugging
      errors.forEach(error => console.error('❌ PlayerManagement: Import error:', error));
    } else {
      toast({
        title: "❌ Upload Failed",
        description: "No players were imported. Please check your file and try again.",
        variant: "destructive"
      });
      console.log('❌ PlayerManagement: Failure toast shown');
      // Log all errors for debugging
      errors.forEach(error => console.error('❌ PlayerManagement: Import error:', error));
    }
  };

  const filteredPlayers = (Array.isArray(players) ? players : []).filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || player.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = (Array.isArray(players) ? players : []).filter(p => p.status === "pending").length;
  const approvedCount = (Array.isArray(players) ? players : []).filter(p => p.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Player Management</h2>
          <p className="text-sm text-gray-600">
            {pendingCount} pending approval • {approvedCount} approved players
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isUploadPlayersOpen} onOpenChange={setIsUploadPlayersOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100">
                <Upload className="h-4 w-4 mr-2" />
                Upload Players
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Players from Excel</DialogTitle>
              </DialogHeader>
              <FileUploadButton onPlayersImported={handlePlayersImported} />
            </DialogContent>
          </Dialog>

          <Dialog open={isCreatePlayerOpen} onOpenChange={setIsCreatePlayerOpen}>
            <DialogTrigger asChild>
              <Button className="bg-nigeria-green hover:bg-nigeria-green-dark">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Player</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={newPlayer.name}
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                    placeholder="Player name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newPlayer.email}
                    onChange={(e) => setNewPlayer({ ...newPlayer, email: e.target.value })}
                    placeholder="player@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newPlayer.phone}
                    onChange={(e) => setNewPlayer({ ...newPlayer, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={newPlayer.gender} onValueChange={(value: "M" | "F") => setNewPlayer({ ...newPlayer, gender: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <StateSelector
                    selectedState={newPlayer.state}
                    onStateChange={(state) => setNewPlayer({ ...newPlayer, state, city: "" })}
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <CitySelector
                    selectedState={newPlayer.state}
                    selectedCity={newPlayer.city}
                    onCityChange={(city) => setNewPlayer({ ...newPlayer, city })}
                  />
                </div>

                <div>
                  <Label htmlFor="fideId">FIDE ID</Label>
                  <Input
                    id="fideId"
                    value={newPlayer.fideId}
                    onChange={(e) => setNewPlayer({ ...newPlayer, fideId: e.target.value })}
                    placeholder="FIDE ID (optional)"
                  />
                </div>

                <div>
                  <Label htmlFor="title">Title</Label>
                  <Select 
                    value={newPlayer.title} 
                    onValueChange={(value: string) => setNewPlayer({ 
                      ...newPlayer, 
                      title: value === "no-title" ? "" : value as "" | "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM"
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select title (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-title">No Title</SelectItem>
                      <SelectItem value="GM">Grandmaster (GM)</SelectItem>
                      <SelectItem value="IM">International Master (IM)</SelectItem>
                      <SelectItem value="FM">FIDE Master (FM)</SelectItem>
                      <SelectItem value="CM">Candidate Master (CM)</SelectItem>
                      <SelectItem value="WGM">Woman Grandmaster (WGM)</SelectItem>
                      <SelectItem value="WIM">Woman International Master (WIM)</SelectItem>
                      <SelectItem value="WFM">Woman FIDE Master (WFM)</SelectItem>
                      <SelectItem value="WCM">Woman Candidate Master (WCM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleCreatePlayer} className="w-full bg-nigeria-green hover:bg-nigeria-green-dark">
                  Create Player
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search players..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Players List */}
      <div className="space-y-4">
        {Array.isArray(filteredPlayers) && filteredPlayers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No players found
            </CardContent>
          </Card>
        ) : (
          Array.isArray(filteredPlayers)
            ? filteredPlayers.map((player) => (
                <Card key={`player-${player.id}`} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{player.name}</h3>
                          <Badge variant={
                            player.status === "approved" ? "default" :
                            player.status === "pending" ? "secondary" : "destructive"
                          }>
                            {player.status}
                          </Badge>
                          {player.title && (
                            <Badge variant="outline">{player.title}</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Email: {player.email}</p>
                          {player.phone && <p>Phone: {player.phone}</p>}
                          {player.state && <p>Location: {player.city}, {player.state}</p>}
                          {player.fideId && <p>FIDE ID: {player.fideId}</p>}
                          {player.rating && <p>Rating: {player.rating}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPlayer(player)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {player.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApproval(player.id, "approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleApproval(player.id, "rejected")}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            : null
        )}
      </div>

      {/* Edit Player Dialog */}
      {editingPlayer && (
        <EditPlayerDialog
          player={editingPlayer}
          isOpen={true}
          onClose={() => setEditingPlayer(null)}
          onSave={(updatedPlayer) => {
            const updatedPlayers = players.map(p => 
              p.id === updatedPlayer.id ? updatedPlayer : p
            );
            setPlayers(updatedPlayers);
            setEditingPlayer(null);
            onPlayerApproval();
            toast({
              title: "Player Updated",
              description: "Player information has been updated successfully",
            });
          }}
        />
      )}
    </div>
  );
};

export default PlayerManagement;
