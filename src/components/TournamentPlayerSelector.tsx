
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, Upload } from "lucide-react";
import { Player, addPlayer } from "@/lib/mockData";
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
  const { toast } = useToast();
  
  const handlePlayersSelected = (players: Player[]) => {
    // Verify all players are approved
    const unapprovedPlayers = players.filter(player => player.status !== 'approved');
    
    if (unapprovedPlayers.length > 0) {
      toast({
        title: "Cannot add unapproved players",
        description: "Only players approved by a Rating Officer can be added to tournaments.",
        variant: "destructive"
      });
      return;
    }
    
    onPlayersAdded(players);
    setIsDialogOpen(false);
  };

  const handlePlayersImported = (players: Partial<Player>[]) => {
    console.log("Players imported:", players);
    
    // Add temporary IDs to the imported players for selection
    const playersWithIds = players.map(player => ({
      ...player,
      tempId: uuidv4()
    })) as ImportPlayerWithTempId[];
    
    setImportedPlayers(playersWithIds);
    setSelectedImportIds(playersWithIds.map(p => p.tempId)); // Auto-select all imported players
    
    // Switch to the review tab
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
    // Create players from the selected imports
    const playersToCreate = importedPlayers
      .filter(player => selectedImportIds.includes(player.tempId))
      .map(player => ({
        id: uuidv4(),
        name: player.name || "Unknown Player",
        title: player.title,
        rating: player.rating || 800,
        country: "Nigeria",
        state: player.state,
        city: player.city,
        gender: player.gender || "M",
        ratingHistory: [{ 
          date: new Date().toISOString().split('T')[0], 
          rating: player.rating || 800,
          reason: "Initial import"
        }],
        tournamentResults: [],
        status: "pending" as const,
        gamesPlayed: 0
      } as Player));
    
    // Add the players to the system
    playersToCreate.forEach(player => {
      addPlayer(player);
    });
    
    toast({
      title: "Players submitted for approval",
      description: `${playersToCreate.length} players have been imported and submitted for Rating Officer approval.`,
    });
    
    // Reset state
    setImportedPlayers([]);
    setSelectedImportIds([]);
    setIsDialogOpen(false);
    setActiveTab("select");
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
        Add Existing Player
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
              <MultiSelectPlayers
                isOpen={true}
                onOpenChange={(open) => {
                  if (!open) handleDialogClose(false);
                }}
                onPlayersSelected={handlePlayersSelected}
                excludeIds={existingPlayerIds}
                hideDialog={true}
              />
            </TabsContent>
            
            <TabsContent value="import">
              {activeTab === "review" && importedPlayers.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Review and confirm players to import. All imported players will require approval from a Rating Officer.
                  </p>
                  
                  <div className="border rounded-md overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto] gap-2 p-2 bg-muted font-medium text-sm">
                      <div></div>
                      <div>Player</div>
                      <div>Rating</div>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto">
                      {importedPlayers.map((player) => (
                        <div 
                          key={player.tempId} 
                          className="grid grid-cols-[auto_1fr_auto] gap-2 p-2 border-t items-center hover:bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={selectedImportIds.includes(player.tempId)}
                            onChange={() => handleImportSelection(player.tempId)}
                            className="h-4 w-4"
                          />
                          <div>
                            {player.title && <span className="text-gold-dark dark:text-gold-light mr-1">{player.title}</span>}
                            {player.name || "Unknown"}
                            {player.state && <span className="text-xs text-muted-foreground ml-2">({player.state})</span>}
                          </div>
                          <div>{player.rating || 800}</div>
                        </div>
                      ))}
                    </div>
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
                      <br />The file should have columns for Name, Rating, and optionally Title, State, City, and Gender.
                    </p>
                    <Button variant="outline" onClick={() => setActiveTab("select")}>
                      Back to Player Selection
                    </Button>
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
