
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
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { updatePlayer, Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import PlayerFormFields from "@/components/player/PlayerFormFields";

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

interface EditPlayerDialogProps {
  player: Player | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const EditPlayerDialog: React.FC<EditPlayerDialogProps> = ({ 
  player,
  isOpen, 
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  
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

  // Update form when player changes
  useEffect(() => {
    if (player) {
      form.reset({
        name: player.name,
        title: player.title || "none",
        rating: player.rating,
        rapidRating: player.rapidRating,
        blitzRating: player.blitzRating,
        gender: player.gender,
        state: player.state || "",
        birthYear: player.birthYear,
      });
    }
  }, [player, form]);

  const onSubmit = (data: PlayerFormValues) => {
    if (!player) return;
    
    try {
      const updatedPlayer: Player = {
        ...player,
        name: data.name,
        title: data.title === "none" ? undefined : data.title,
        rating: data.rating,
        rapidRating: data.rapidRating,
        blitzRating: data.blitzRating,
        gender: data.gender,
        state: data.state,
        birthYear: data.birthYear,
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
      
      updatePlayer(updatedPlayer);
      
      toast({
        title: "Player updated successfully",
        description: `${data.name}'s information has been updated.`,
      });
      
      onOpenChange(false);
      
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Player</DialogTitle>
          <DialogDescription>
            Update the player's details in the Nigerian Chess Rating system.
          </DialogDescription>
        </DialogHeader>
        
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
