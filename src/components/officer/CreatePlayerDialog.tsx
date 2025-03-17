
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { addPlayer, Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import PlayerFormFields from "@/components/player/PlayerFormFields";
import { v4 as uuidv4 } from "uuid";
import FileUploadButton from "@/components/players/FileUploadButton";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

const playerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  title: z.string().optional(),
  rating: z.coerce.number().min(800, "Rating must be at least 800"),
  rapidRating: z.coerce.number().optional(),
  blitzRating: z.coerce.number().optional(),
  gender: z.enum(["M", "F"]),
  state: z.string().optional(),
  birthYear: z.coerce.number().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface CreatePlayerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerCreated?: () => void;
  onSuccess?: () => void;
}

interface ImportPlayerWithTempId extends Partial<Player> {
  tempId: string;
}

const CreatePlayerDialog: React.FC<CreatePlayerDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  onPlayerCreated,
  onSuccess
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("single");
  const [importedPlayers, setImportedPlayers] = useState<ImportPlayerWithTempId[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "none",
      rating: 800,
      rapidRating: undefined,
      blitzRating: undefined,
      gender: "M",
      state: "",
      birthYear: undefined,
    },
  });

  const onSubmit = (data: PlayerFormValues) => {
    try {
      const currentDate = new Date().toISOString();
      
      const newPlayer: Player = {
        id: uuidv4(),
        name: data.name,
        title: data.title === "none" ? undefined : data.title,
        rating: data.rating,
        rapidRating: data.rapidRating,
        blitzRating: data.blitzRating,
        gender: data.gender,
        state: data.state,
        birthYear: data.birthYear,
        ratingHistory: [
          {
            date: currentDate,
            rating: data.rating,
            reason: "Initial rating"
          }
        ],
        tournamentResults: [],
        gamesPlayed: 0
      };
      
      addPlayer(newPlayer);
      
      toast({
        title: "Player created successfully",
        description: `${data.name} has been added to the system.`,
      });
      
      form.reset();
      onOpenChange(false);
      
      if (onPlayerCreated) {
        onPlayerCreated();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error creating player",
        description: "There was an error creating the player. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePlayersImported = (players: Partial<Player>[]) => {
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
    try {
      // Create players from the selected imports
      const playersToCreate = importedPlayers
        .filter(player => selectedImportIds.includes(player.tempId))
        .map(player => {
          const rating = player.rating || 800;
          const currentDate = new Date().toISOString();
          
          return {
            id: uuidv4(),
            name: player.name || "Unknown Player",
            title: player.title,
            rating: rating,
            rapidRating: player.rapidRating,
            blitzRating: player.blitzRating,
            country: "Nigeria",
            state: player.state?.replace(" NGR", "").trim() || undefined,
            city: player.city,
            gender: player.gender || "M",
            birthYear: player.birthYear,
            ratingHistory: [{ 
              date: currentDate, 
              rating: rating,
              reason: "Initial import"
            }],
            tournamentResults: [],
            gamesPlayed: 0
          } as Player;
        });
      
      // Add the players to the system
      playersToCreate.forEach(player => {
        addPlayer(player);
      });
      
      toast({
        title: "Players created successfully",
        description: `${playersToCreate.length} players have been imported and added to the system.`,
      });
      
      // Reset state
      setImportedPlayers([]);
      setSelectedImportIds([]);
      setActiveTab("single");
      
      // Close the dialog
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error importing players:", error);
      toast({
        title: "Error importing players",
        description: "There was an error importing the players. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  const resetImportedPlayers = () => {
    setImportedPlayers([]);
    setSelectedImportIds([]);
    setActiveTab("import");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the Nigerian Chess Rating system
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="single">Single Player</TabsTrigger>
            <TabsTrigger value="import">Import Players</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <PlayerFormFields control={form.control} formState={form.formState} />
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => onOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                  >
                    Create Player
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="import">
            {activeTab === "review" && importedPlayers.length > 0 ? (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-medium">Review Players</h3>
                  <p className="text-sm text-muted-foreground">
                    Review and confirm the players to import. Select the checkbox for each player you want to add.
                  </p>
                </div>
                
                <ScrollArea className="h-[300px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>State</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
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
                          <TableCell>{player.title ? `${player.title} ` : ""}{player.name || "Unknown"}</TableCell>
                          <TableCell>{player.rating || 800}</TableCell>
                          <TableCell>{player.gender || "M"}</TableCell>
                          <TableCell>{player.state?.replace(" NGR", "") || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
                
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
                    className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                  >
                    Import {selectedImportIds.length} Player{selectedImportIds.length !== 1 ? 's' : ''}
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
  );
};

export default CreatePlayerDialog;
