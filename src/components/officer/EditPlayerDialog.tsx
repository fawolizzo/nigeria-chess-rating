
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
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
import { Button } from "@/components/ui/button";
import { updatePlayer, Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import PlayerFormFields from "@/components/player/PlayerFormFields";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const playerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  title: z.string().optional(),
  rating: z.coerce.number().min(800, "Rating must be at least 800"),
  rapidRating: z.coerce.number().optional(),
  blitzRating: z.coerce.number().optional(),
  gender: z.enum(["M", "F"]),
  state: z.string().optional(),
  birthYear: z.coerce.number().optional(),
  gamesPlayed: z.coerce.number().optional(),
  rapidGamesPlayed: z.coerce.number().optional(),
  blitzGamesPlayed: z.coerce.number().optional(),
  ratingStatus: z.enum(["provisional", "established"]).optional(),
  rapidRatingStatus: z.enum(["provisional", "established"]).optional(),
  blitzRatingStatus: z.enum(["provisional", "established"]).optional(),
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface EditPlayerDialogProps {
  player: Player | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerEdited?: () => void;
  onSuccess?: () => void;
}

const EditPlayerDialog: React.FC<EditPlayerDialogProps> = ({ 
  player,
  isOpen, 
  onOpenChange,
  onPlayerEdited,
  onSuccess
}) => {
  const { toast } = useToast();
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      id: "",
      name: "",
      title: "none",
      rating: 800,
      rapidRating: undefined,
      blitzRating: undefined,
      gender: "M",
      state: "",
      birthYear: undefined,
      gamesPlayed: undefined,
      rapidGamesPlayed: undefined,
      blitzGamesPlayed: undefined,
      ratingStatus: "provisional",
      rapidRatingStatus: "provisional",
      blitzRatingStatus: "provisional",
    },
  });

  // Generate a unique NCR ID for the player if not already exists
  const generateNcrId = () => {
    const randomPart = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    const timestamp = Date.now().toString().slice(-5); // Last 5 digits of timestamp
    return `NCR${randomPart}${timestamp}`;
  };

  // Update form when player changes
  useEffect(() => {
    if (player) {
      form.reset({
        id: player.id,
        name: player.name,
        title: player.title || "none",
        rating: player.rating,
        rapidRating: player.rapidRating,
        blitzRating: player.blitzRating,
        gender: player.gender,
        state: player.state || "",
        birthYear: player.birthYear,
        gamesPlayed: player.gamesPlayed,
        rapidGamesPlayed: player.rapidGamesPlayed,
        blitzGamesPlayed: player.blitzGamesPlayed,
        ratingStatus: player.ratingStatus || "provisional",
        rapidRatingStatus: player.rapidRatingStatus || "provisional",
        blitzRatingStatus: player.blitzRatingStatus || "provisional",
      });
    }
  }, [player, form]);

  // Helper function to determine if a rating has +100
  const hasPlus100Rating = (rating: number | undefined): boolean => {
    if (!rating) return false;
    return String(rating).endsWith('100');
  };

  // Adjust games played for +100 ratings when submitting
  const adjustGamesPlayed = (rating: number | undefined, gamesPlayed: number | undefined, status?: string): number | undefined => {
    if (!rating || !gamesPlayed) return gamesPlayed;
    
    // If status is established or has +100 rating, ensure games played is at least 30
    if (status === 'established' || String(rating).endsWith('100')) {
      return Math.max(30, gamesPlayed);
    }
    
    return gamesPlayed;
  };

  const onSubmit = (data: PlayerFormValues) => {
    if (!player) return;
    
    try {
      // Ensure player has NCR-prefixed ID
      const playerId = data.id && data.id.startsWith('NCR') ? data.id : player.id.startsWith('NCR') ? player.id : generateNcrId();
      
      // Adjust games played based on rating status
      const adjustedGamesPlayed = adjustGamesPlayed(data.rating, data.gamesPlayed, data.ratingStatus);
      const adjustedRapidGamesPlayed = adjustGamesPlayed(data.rapidRating, data.rapidGamesPlayed, data.rapidRatingStatus);
      const adjustedBlitzGamesPlayed = adjustGamesPlayed(data.blitzRating, data.blitzGamesPlayed, data.blitzRatingStatus);
      
      const updatedPlayer: Player = {
        ...player,
        id: playerId,
        name: data.name,
        title: data.title === "none" ? undefined : data.title,
        rating: data.rating,
        rapidRating: data.rapidRating,
        blitzRating: data.blitzRating,
        gender: data.gender,
        state: data.state,
        birthYear: data.birthYear,
        gamesPlayed: adjustedGamesPlayed,
        rapidGamesPlayed: adjustedRapidGamesPlayed,
        blitzGamesPlayed: adjustedBlitzGamesPlayed,
        ratingStatus: data.ratingStatus,
        rapidRatingStatus: data.rapidRatingStatus,
        blitzRatingStatus: data.blitzRatingStatus,
      };
      
      // Only add to history if rating changed
      if (data.rating !== player.rating) {
        updatedPlayer.ratingHistory = [
          ...player.ratingHistory,
          {
            date: new Date().toISOString(),
            rating: data.rating,
            reason: "Manual adjustment"
          }
        ];
      }
      
      // Add to rapid rating history if changed
      if (data.rapidRating !== player.rapidRating && data.rapidRating !== undefined) {
        if (!updatedPlayer.rapidRatingHistory) {
          updatedPlayer.rapidRatingHistory = [];
        }
        
        updatedPlayer.rapidRatingHistory = [
          ...updatedPlayer.rapidRatingHistory,
          {
            date: new Date().toISOString(),
            rating: data.rapidRating,
            reason: "Manual adjustment"
          }
        ];
      }
      
      // Add to blitz rating history if changed
      if (data.blitzRating !== player.blitzRating && data.blitzRating !== undefined) {
        if (!updatedPlayer.blitzRatingHistory) {
          updatedPlayer.blitzRatingHistory = [];
        }
        
        updatedPlayer.blitzRatingHistory = [
          ...updatedPlayer.blitzRatingHistory,
          {
            date: new Date().toISOString(),
            rating: data.blitzRating,
            reason: "Manual adjustment"
          }
        ];
      }
      
      updatePlayer(updatedPlayer);
      
      toast({
        title: "Player updated successfully",
        description: `${data.name}'s information has been updated.`,
      });
      
      onOpenChange(false);
      
      if (onPlayerEdited) {
        onPlayerEdited();
      }
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error updating player:", error);
      toast({
        title: "Error updating player",
        description: "There was an error updating the player. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update the player's details in the Nigerian Chess Rating system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Player ID</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Player ID" 
                      {...field} 
                      value={field.value || ""}
                      disabled={field.value?.startsWith('NCR')} // Prevent editing NCR IDs
                    />
                  </FormControl>
                  <FormDescription>
                    Unique identifier for the player. {!field.value?.startsWith('NCR') && "A new NCR ID will be generated."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <PlayerFormFields control={form.control} formState={form.formState} />
            
            {/* Rating status section */}
            <div className="border rounded-md p-4 space-y-4">
              <h3 className="font-medium">Rating Status</h3>
              
              <FormField
                control={form.control}
                name="ratingStatus"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Classical Rating Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="provisional" id="classical-provisional" />
                          <Label htmlFor="classical-provisional">Provisional</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="established" id="classical-established" />
                          <Label htmlFor="classical-established">Established</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      {form.watch('ratingStatus') === 'established' 
                        ? "Player will be treated as having completed the 30-game provisional period"
                        : "Player must complete 30 games to achieve established rating"}
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
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="provisional" id="rapid-provisional" />
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
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="provisional" id="blitz-provisional" />
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
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-nigeria-green hover:bg-nigeria-green-dark text-white"
              >
                Update Player
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditPlayerDialog;
