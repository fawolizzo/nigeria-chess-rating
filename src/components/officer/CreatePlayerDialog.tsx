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
// import { addPlayer, Player } from "@/lib/mockData"; // Removed addPlayer
import { Player } from "@/lib/mockData"; // Kept Player type
import { createPlayerInSupabase } from "@/services/playerService"; // Added Supabase service
import { useToast } from "@/components/ui/use-toast";
import PlayerFormFields from "@/components/player/PlayerFormFields";
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
  const [isSubmitting, setIsSubmitting] = useState(false); // Added for loading state
  
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

  const generateNcrId = () => {
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    const timestamp = Date.now().toString().slice(-5);
    return `NCR${randomPart}${timestamp}`;
  };

  const onSubmit = async (data: PlayerFormValues) => {
    setIsSubmitting(true);
    try {
      // const currentDate = new Date().toISOString(); // Not needed for Supabase creation here
      // const ncrId = generateNcrId(); // Supabase will generate ID
      
      let finalClassicalRating = data.rating;
      let finalRapidRating = data.rapidRating;
      let finalBlitzRating = data.blitzRating;
      
      if (data.apply100Bonus) {
        finalClassicalRating += 100;
        if (finalRapidRating !== undefined) finalRapidRating += 100;
        if (finalBlitzRating !== undefined) finalBlitzRating += 100;
      }
      
      const classicalGamesPlayed = data.ratingStatus === 'established' || data.apply100Bonus ? 30 : 0;
      const rapidGamesPlayed = (data.rapidRatingStatus === 'established' && finalRapidRating !== undefined) || 
                               (data.apply100Bonus && finalRapidRating !== undefined) ? 30 : 0;
      const blitzGamesPlayed = (data.blitzRatingStatus === 'established' && finalBlitzRating !== undefined) || 
                              (data.apply100Bonus && finalBlitzRating !== undefined) ? 30 : 0;
      
      const playerDataToSave: Omit<Player, 'id' | 'ratingHistory' | 'tournamentResults'> = {
        name: data.name,
        title: data.title === "none" ? undefined : data.title,
        rating: finalClassicalRating,
        rapidRating: finalRapidRating,
        blitzRating: finalBlitzRating,
        gender: data.gender,
        state: data.state,
        birthYear: data.birthYear,
        ratingStatus: data.apply100Bonus ? 'established' : data.ratingStatus,
        rapidRatingStatus: finalRapidRating !== undefined ? 
                          (data.apply100Bonus ? 'established' : data.rapidRatingStatus) : 
                          'provisional', // Default to provisional if rating is not set
        blitzRatingStatus: finalBlitzRating !== undefined ? 
                          (data.apply100Bonus ? 'established' : data.blitzRatingStatus) : 
                          'provisional', // Default to provisional if rating is not set
        gamesPlayed: classicalGamesPlayed,
        rapidGamesPlayed: rapidGamesPlayed,
        blitzGamesPlayed: blitzGamesPlayed,
        status: 'approved', // Officer creation implies approval
        // achievements and other optional fields will be undefined if not in `data`
      };
      
      // Add optional fields like club if they exist in `data`
      if (data.club) {
        (playerDataToSave as Player).club = data.club; // Casting because club is optional on Omit type
      }

      const createdPlayer = await createPlayerInSupabase(playerDataToSave);
      
      if (createdPlayer) {
        toast({
          title: "Player created successfully",
          description: `${createdPlayer.name} has been added with ID: ${createdPlayer.id}.`,
        });
        
        form.reset();
        handleOpenChange(false);
        
        if (onPlayerCreated) {
          onPlayerCreated(createdPlayer); // Pass the player returned from Supabase
        }
        
        if (onSuccess) {
          onSuccess();
        }
      } else {
        throw new Error("Player creation failed in Supabase service.");
      }
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error Creating Player",
        description: error instanceof Error ? error.message : "There was an error creating the player. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayersImported = (players: Partial<Player>[]) => {
    const playersWithIds = players.map(player => ({
      ...player,
      tempId: player.id || generateNcrId()
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

  const submitImportedPlayers = async () => { // Made async
    setIsSubmitting(true); // Added for loading state
    try {
      const playersToCreatePromises = importedPlayers
        .filter(player => selectedImportIds.includes(player.tempId))
        .map(async (player) => { // map callback is async
          // const ncrId = player.id || generateNcrId(); // Supabase handles ID
          const rating = player.rating || 800;
          // const currentDate = new Date().toISOString(); // Not needed for Supabase
          
          const playerDataToSave: Omit<Player, 'id' | 'ratingHistory' | 'tournamentResults'> = {
            name: player.name || "Unknown Player",
            title: player.title,
            rating: rating,
            rapidRating: player.rapidRating,
            blitzRating: player.blitzRating,
            country: "Nigeria", // Assuming default
            state: player.state?.replace(" NGR", "").trim() || undefined,
            city: player.city,
            gender: player.gender || "M",
            birthYear: player.birthYear,
            ratingStatus: player.ratingStatus || 'established', // Default for import
            rapidRatingStatus: player.rapidRatingStatus || (player.rapidRating ? 'established' : undefined),
            blitzRatingStatus: player.blitzRatingStatus || (player.blitzRating ? 'established' : undefined),
            gamesPlayed: player.gamesPlayed || 30, // Default for import
            rapidGamesPlayed: player.rapidGamesPlayed || (player.rapidRating ? 30 : undefined),
            blitzGamesPlayed: player.blitzGamesPlayed || (player.blitzRating ? 30 : undefined),
            status: 'approved' // Officer import implies approval
          };
          if (player.club) {
            (playerDataToSave as Player).club = player.club;
          }
          return createPlayerInSupabase(playerDataToSave); // Return the promise
        });
      
      const createdImportedPlayers = await Promise.all(playersToCreatePromises);
      const successfulCreations = createdImportedPlayers.filter(p => p !== null);

      if (successfulCreations.length > 0) {
        toast({
          title: "Players Imported Successfully",
          description: `${successfulCreations.length} players have been imported and added.`,
        });
      }

      if (successfulCreations.length !== playersToCreatePromises.length) {
         const failedCount = playersToCreatePromises.length - successfulCreations.length;
        toast({
          title: "Some Imports Failed",
          description: `${failedCount} player(s) could not be imported. Please check logs.`,
          variant: "warning"
        });
      }
      
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
        title: "Error Importing Players",
        description: error instanceof Error ? error.message : "There was an error importing players.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false); // Reset loading state
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
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Create Player"}
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
                        <TableHead>ID</TableHead>
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
                          <TableCell>{player.id || "Auto-generated"}</TableCell>
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
                    disabled={selectedImportIds.length === 0 || isSubmitting}
                    className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
                  >
                    {isSubmitting && activeTab === 'review' ? "Importing..." : `Import ${selectedImportIds.length} Player${selectedImportIds.length !== 1 ? 's' : ''}`}
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
