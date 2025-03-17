
import React from "react";
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
import { addPlayer, Player } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import PlayerFormFields from "@/components/player/PlayerFormFields";
import { v4 as uuidv4 } from "uuid";

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

const CreatePlayerDialog: React.FC<CreatePlayerDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  onPlayerCreated,
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the Nigerian Chess Rating system.
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
                Create Player
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlayerDialog;
