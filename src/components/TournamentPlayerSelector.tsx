
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
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

const TournamentPlayerSelector = ({ 
  tournamentId,
  existingPlayerIds,
  onPlayersAdded 
}: TournamentPlayerSelectorProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [importedPlayers, setImportedPlayers] = useState<Partial<Player>[]>([]);
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
    // Add temporary IDs to the imported players for selection
    const playersWithIds = players.map(player => ({
      ...player,
      tempId: uuidv4()
    }));
    
    setImportedPlayers(playersWithIds);
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
      .filter(player => player.tempId && selectedImportIds.includes(player.tempId))
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
        status: "pending",
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
  
  return (
    <div className="relative">
      <Button 
        variant="outline" 
        size="sm"
        className="text-sm"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Existing Player
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <TabsTrigger value="review">Import Players</TabsTrigger>
            </TabsList>
            
            <TabsContent value="select">
              <div className="space-y-4">
                <FileUploadButton onPlayersImported={handlePlayersImported} />
                
                <div className="mt-4">
                  <MultiSelectPlayers
                    isOpen={true}
                    onOpenChange={() => {}}
                    onPlayersSelected={handlePlayersSelected}
                    excludeIds={existingPlayerIds}
                    hideDialog={true}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="review">
              {importedPlayers.length > 0 ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select players to import. All imported players will require approval from a Rating Officer.
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
                            checked={player.tempId ? selectedImportIds.includes(player.tempId) : false}
                            onChange={() => player.tempId && handleImportSelection(player.tempId)}
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
                      onClick={() => {
                        setActiveTab("select");
                        setSelectedImportIds([]);
                      }}
                    >
                      Back
                    </Button>
                    <Button 
                      onClick={submitImportedPlayers}
                      disabled={selectedImportIds.length === 0}
                    >
                      Submit {selectedImportIds.length} Players
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <Users className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-1">No players to review</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Import players from a CSV or Excel file first
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab("select")}>
                    Back to Import
                  </Button>
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
