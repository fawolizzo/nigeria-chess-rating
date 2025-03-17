
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, UserPlus, X, Users, AlertTriangle } from "lucide-react";
import { Player, addPlayer, getAllPlayers } from "@/lib/mockData";
import { MultiSelectPlayers } from "@/components/MultiSelectPlayers";
import { useToast } from "@/components/ui/use-toast";
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";
import FileUploadButton from "./players/FileUploadButton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TournamentPlayerSelectorProps {
  tournamentId: string;
  existingPlayerIds: string[];
  onPlayersAdded: (players: Player[]) => void;
}

interface ImportPlayerWithTempId extends Partial<Player> {
  tempId: string;
}

const TournamentPlayerSelector = ({ 
  tournamentId,
  existingPlayerIds,
  onPlayersAdded 
}: TournamentPlayerSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importedPlayers, setImportedPlayers] = useState<ImportPlayerWithTempId[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("select");
  const [pendingPlayersExist, setPendingPlayersExist] = useState(false);
  const { toast } = useToast();
  
  const handlePlayersSelected = (players: Player[]) => {
    // Check if any players are pending
    const pendingPlayers = players.filter(player => player.status === 'pending');
    
    if (pendingPlayers.length > 0) {
      toast({
        title: "Some players require approval",
        description: `${pendingPlayers.length} selected player(s) require approval from a Rating Officer before they can be used in tournaments.`,
        variant: "warning"
      });
    }
    
    // We'll add all players, but tournament logic will handle pending players appropriately
    onPlayersAdded(players);
    setIsDialogOpen(false);
  };

  const handlePlayersImported = (players: Partial<Player>[]) => {
    console.log("Players imported:", players);
    
    // For players that have complete necessary fields, add them directly to the system
    // but set status to pending so the Rating Officer needs to approve them
    const playersToCreate = players
      .filter(p => p.name && p.id)
      .map(player => ({
        id: player.id as string, // Using the UUID created in FileUploadButton
        name: player.name as string,
        title: player.title,
        rating: player.rating || 800,
        country: "Nigeria",
        state: player.state,
        city: player.city,
        gender: player.gender || "M",
        birthYear: player.birthYear,
        ratingHistory: [{ 
          date: new Date().toISOString().split('T')[0], 
          rating: player.rating || 800,
          reason: "Initial import"
        }],
        tournamentResults: [],
        status: "pending" as const, // IMPORTANT: All imported players must be set to pending
        gamesPlayed: 0,
        createdBy: "current_user" // This would be replaced with actual user ID in a real app
      } as Player));
    
    // Add the players to the system
    playersToCreate.forEach(player => {
      addPlayer(player);
    });
    
    toast({
      title: "Players imported successfully",
      description: `${playersToCreate.length} players have been imported and will require Rating Officer approval before they can be used in tournaments.`,
      variant: "warning"
    });
    
    // For review purposes, convert them to have tempId
    const playersWithTempIds: ImportPlayerWithTempId[] = players.map(player => ({
      ...player,
      tempId: (player.id as string) || uuidv4()
    }));
    
    setImportedPlayers(playersWithTempIds);
    setSelectedImportIds(playersWithTempIds.map(p => p.tempId)); // Auto-select all
    setPendingPlayersExist(true);
    
    // Switch to the review tab to show what we imported
    setActiveTab("review");
  };

  const handleImportSelection = (tempId: string) => {
    if (selectedImportIds.includes(tempId)) {
      setSelectedImportIds(selectedImportIds.filter(id => id !== tempId));
    } else {
      setSelectedImportIds([...selectedImportIds, tempId]);
    }
  };

  const submitImportedPlayers = () => {
    // We've already created the players in handlePlayersImported
    // Just return to the selection tab now
    setActiveTab("select");
    setImportedPlayers([]);
    setSelectedImportIds([]);
  };
  
  const resetImportedPlayers = () => {
    setImportedPlayers([]);
    setSelectedImportIds([]);
    setActiveTab("import");
  };
  
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset everything when dialog is closed
      setActiveTab("select");
      setImportedPlayers([]);
      setSelectedImportIds([]);
    }
    setIsDialogOpen(open);
  };
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={() => handleDialogClose(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Players
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Players to Tournament</DialogTitle>
            <DialogDescription>
              Select existing players or import new players for your tournament
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="select">Select Players</TabsTrigger>
              <TabsTrigger value="import">Import Players</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select" className="mt-4">
              {pendingPlayersExist && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <p className="text-yellow-700">
                    Imported players need approval from a Rating Officer before they can participate in tournaments. 
                    You can include them in your selection, but the tournament cannot start until all players are approved.
                  </p>
                </div>
              )}
              
              <MultiSelectPlayers
                isOpen={activeTab === "select"}
                onOpenChange={(open) => {
                  if (!open) handleDialogClose(false);
                }}
                onPlayersSelected={handlePlayersSelected}
                excludeIds={existingPlayerIds}
                hideDialog={true}
                includePendingPlayers={true} // Show pending players too
              />
            </TabsContent>
            
            <TabsContent value="import">
              {activeTab === "review" && importedPlayers.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review imported players. All players will require Rating Officer approval before they can participate in tournaments.
                  </p>
                  
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Player</TableHead>
                          <TableHead className="w-[80px]">Rating</TableHead>
                          <TableHead className="w-[100px]">Birth Year</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="max-h-[300px] overflow-y-auto">
                        {importedPlayers.map((player) => (
                          <TableRow key={player.tempId}>
                            <TableCell>
                              <input
                                type="checkbox"
                                checked={selectedImportIds.includes(player.tempId)}
                                onChange={() => handleImportSelection(player.tempId)}
                                className="h-4 w-4"
                              />
                            </TableCell>
                            <TableCell>
                              {player.title && <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>}
                              {player.name || "Unknown"}
                              {player.state && <span className="text-xs text-muted-foreground ml-2">({player.state?.replace(" NGR", "")})</span>}
                            </TableCell>
                            <TableCell>{player.rating || 800}</TableCell>
                            <TableCell>{player.birthYear || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <DialogFooter className="mt-4">
                    <Button 
                      variant="outline" 
                      onClick={resetImportedPlayers}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={submitImportedPlayers}
                      disabled={selectedImportIds.length === 0}
                    >
                      Submit {selectedImportIds.length} Player{selectedImportIds.length !== 1 ? 's' : ''}
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="py-6">
                  <div className="w-full mx-auto">
                    <FileUploadButton 
                      onPlayersImported={handlePlayersImported} 
                      buttonText="Import Players from CSV/Excel"
                    />
                  </div>
                  
                  <div className="text-center mt-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a CSV or Excel file with player information.
                      <br />The file should have columns for Player Name, Rating, and optionally Title, Birth Year, and Gender.
                    </p>
                    <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                      <p>Expected column headers:</p>
                      <p className="text-xs mt-1">Player, Rating, Title, B-Year (or Birth Year), Gender/Sex</p>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentPlayerSelector;
