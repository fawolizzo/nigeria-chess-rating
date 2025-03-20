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
  FormMessage,
  FormDescription
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle } from "lucide-react";

const playerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  title: z.string().optional(),
  rating: z.coerce.number().min(800, "Rating must be at least 800"),
  rapidRating: z.coerce.number().optional(),
  blitzRating: z.coerce.number().optional(),
  gender: z.enum(["M", "F"]),
  state: z.string().optional(),
  birthYear: z.coerce.number().optional(),
  ratingStatus: z.enum(["provisional", "established"]),
  rapidRatingStatus: z.enum(["provisional", "established"]).optional(),
  blitzRatingStatus: z.enum(["provisional", "established"]).optional(),
  apply100Bonus: z.boolean().optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface CreatePlayerDialogProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPlayerCreated?: (playerData: any) => void;
  onSuccess?: () => void;
}

interface ImportPlayerWithTempId extends Partial<Player> {
  tempId: string;
}

const CreatePlayerDialog: React.FC<Partial<CreatePlayerDialogProps>> = ({ 
  isOpen, 
  onOpenChange,
  onPlayerCreated,
  onSuccess
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("single");
  const [importedPlayers, setImportedPlayers] = useState<ImportPlayerWithTempId[]>([]);
  const [selectedImportIds, setSelectedImportIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  
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
      ratingStatus: "provisional",
      rapidRatingStatus: "provisional",
      blitzRatingStatus: "provisional",
      apply100Bonus: false,
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setOpen(newOpen);
    }
  };

  const onSubmit = (data: PlayerFormValues) => {
    try {
      const currentDate = new Date().toISOString();
      
      // Apply +100 bonus if selected by the rating officer
      let finalClassicalRating = data.rating;
      let finalRapidRating = data.rapidRating;
      let finalBlitzRating = data.blitzRating;
      
      if (data.apply100Bonus) {
        finalClassicalRating += 100;
        if (finalRapidRating) finalRapidRating += 100;
        if (finalBlitzRating) finalBlitzRating += 100;
      }
      
      // Set games played based on rating status
      // Established ratings should start at 30 games
      const classicalGamesPlayed = data.ratingStatus === 'established' ? 30 : 0;
      const rapidGamesPlayed = data.rapidRatingStatus === 'established' ? 30 : 0;
      const blitzGamesPlayed = data.blitzRatingStatus === 'established' ? 30 : 0;
      
      const newPlayer: Player = {
        id: uuidv4(),
        name: data.name,
        title: data.title === "none" ? undefined : data.title,
        rating: finalClassicalRating,
        rapidRating: finalRapidRating,
        blitzRating: finalBlitzRating,
        gender: data.gender,
        state: data.state,
        birthYear: data.birthYear,
        ratingStatus: data.ratingStatus,
        rapidRatingStatus: data.rapidRatingStatus,
        blitzRatingStatus: data.blitzRatingStatus,
        gamesPlayed: classicalGamesPlayed,
        rapidGamesPlayed: rapidGamesPlayed,
        blitzGamesPlayed: blitzGamesPlayed,
        status: 'approved',
        ratingHistory: [
          {
            date: currentDate,
            rating: finalClassicalRating,
            reason: data.apply100Bonus ? "Initial rating with +100 bonus" : "Initial rating"
          }
        ],
        tournamentResults: [],
      };
      
      // Add rapid rating history if applicable
      if (finalRapidRating) {
        newPlayer.rapidRatingHistory = [
          {
            date: currentDate,
            rating: finalRapidRating,
            reason: data.apply100Bonus ? "Initial rating with +100 bonus" : "Initial rating"
          }
        ];
      }
      
      // Add blitz rating history if applicable
      if (finalBlitzRating) {
        newPlayer.blitzRatingHistory = [
          {
            date: currentDate,
            rating: finalBlitzRating,
            reason: data.apply100Bonus ? "Initial rating with +100 bonus" : "Initial rating"
          }
        ];
      }
      
      addPlayer(newPlayer);
      
      toast({
        title: "Player created successfully",
        description: `${data.name} has been added to the system.`,
      });
      
      form.reset();
      handleOpenChange(false);
      
      if (onPlayerCreated) {
        onPlayerCreated(newPlayer);
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
    const playersWithIds = players.map(player => ({
      ...player,
      tempId: uuidv4()
    })) as ImportPlayerWithTempId[];
    
    setImportedPlayers(playersWithIds);
    setSelectedImportIds(playersWithIds.map(p => p.tempId));
    
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
      
      playersToCreate.forEach(player => {
        addPlayer(player);
      });
      
      toast({
        title: "Players created successfully",
        description: `${playersToCreate.length} players have been imported and added to the system.`,
      });
      
      setImportedPlayers([]);
      setSelectedImportIds([]);
      setActiveTab("single");
      
      handleOpenChange(false);
      
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

  const isDialogOpen = isOpen !== undefined ? isOpen : open;

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CheckCircle className="h-4 w-4 mr-2" />
          Add Player
        </Button>
      </DialogTrigger>
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
                
                {/* Rating status section */}
                <div className="border rounded-md p-4 space-y-4">
                  <h3 className="font-medium">Rating Status</h3>
                  
                  <FormField
                    control={form.control}
                    name="apply100Bonus"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 rounded-md border p-4 mb-4">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Apply +100 Rating Bonus</FormLabel>
                          <FormDescription>
                            Adds 100 points to the player's initial rating in all formats and treats them as established
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ratingStatus"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Classical Rating Status</FormLabel>
                        <FormControl>
                          <RadioGroup
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              // If +100 bonus is checked, all ratings should be established
                              if (form.watch('apply100Bonus')) {
                                form.setValue('ratingStatus', 'established');
                              }
                            }}
                            className="flex space-x-4"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value="provisional" 
                                id="classical-provisional" 
                                disabled={form.watch('apply100Bonus')}
                              />
                              <Label htmlFor="classical-provisional">Provisional</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="established" id="classical-established" />
                              <Label htmlFor="classical-established">Established</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormDescription>
                          {field.value === 'established' 
                            ? "Player will start with 30 games played (established rating)"
                            : "Player will start with 0 games played (provisional rating)"}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {form.watch('rapidRating') && (
                    <FormField
                      control={form.control}
                      name="rapidRatingStatus"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Rapid Rating Status</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // If +100 bonus is checked, all ratings should be established
                                if (form.watch('apply100Bonus')) {
                                  form.setValue('rapidRatingStatus', 'established');
                                }
                              }}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value="provisional" 
                                  id="rapid-provisional" 
                                  disabled={form.watch('apply100Bonus')}
                                />
                                <Label htmlFor="rapid-provisional">Provisional</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="established" id="rapid-established" />
                                <Label htmlFor="rapid-established">Established</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                  
                  {form.watch('blitzRating') && (
                    <FormField
                      control={form.control}
                      name="blitzRatingStatus"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Blitz Rating Status</FormLabel>
                          <FormControl>
                            <RadioGroup
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                // If +100 bonus is checked, all ratings should be established
                                if (form.watch('apply100Bonus')) {
                                  form.setValue('blitzRatingStatus', 'established');
                                }
                              }}
                              className="flex space-x-4"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value="provisional" 
                                  id="blitz-provisional" 
                                  disabled={form.watch('apply100Bonus')}
                                />
                                <Label htmlFor="blitz-provisional">Provisional</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="established" id="blitz-established" />
                                <Label htmlFor="blitz-established">Established</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => handleOpenChange(false)}
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
                        <TableHead>Title</TableHead>
                        <TableHead>Classical</TableHead>
                        <TableHead>Rapid</TableHead>
                        <TableHead>Blitz</TableHead>
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
                          <TableCell>{player.name || "Unknown"}</TableCell>
                          <TableCell>{player.title || "-"}</TableCell>
                          <TableCell>{player.rating || "-"}</TableCell>
                          <TableCell>{player.rapidRating || "-"}</TableCell>
                          <TableCell>{player.blitzRating || "-"}</TableCell>
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
                    <br />The file should have columns for Player Name, Title, Federation, and Ratings.
                  </p>
                  <div className="mt-3 p-3 bg-muted rounded-md text-sm">
                    <p>Expected column headers format:</p>
                    <p className="text-xs mt-1 font-mono">Players | Title | Fed | Std. | Rpd. | Blz. | B-Year</p>
                    <p className="text-xs mt-2">Where:</p>
                    <ul className="text-xs mt-1 list-disc list-inside">
                      <li>Std. = Classical rating</li>
                      <li>Rpd. = Rapid rating</li>
                      <li>Blz. = Blitz rating</li>
                      <li>B-Year = Birth Year</li>
                    </ul>
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
