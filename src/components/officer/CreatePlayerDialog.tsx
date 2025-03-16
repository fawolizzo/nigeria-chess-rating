
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
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@/contexts/UserContext";
import { addPlayer } from "@/lib/mockData";
import { useToast } from "@/components/ui/use-toast";
import StateSelector from "@/components/selectors/StateSelector";

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
  onSuccess?: () => void;
}

const CreatePlayerDialog: React.FC<CreatePlayerDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  onSuccess
}) => {
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "",
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
      const newPlayer = {
        id: uuidv4(),
        name: data.name,
        title: data.title || undefined,
        rating: data.rating,
        rapidRating: data.rapidRating,
        blitzRating: data.blitzRating,
        gender: data.gender,
        state: data.state,
        birthYear: data.birthYear,
        ratingHistory: [
          {
            date: new Date().toISOString(),
            rating: data.rating,
            reason: "Initial rating"
          }
        ],
        achievements: [],
        tournamentResults: [],
        status: "approved" as const,
        createdBy: currentUser?.id,
        gamesPlayed: 0
      };
      
      addPlayer(newPlayer);
      
      toast({
        title: "Player created successfully",
        description: `${data.name} has been added to the system.`,
      });
      
      form.reset();
      onOpenChange(false);
      
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
            Enter the player's details to add them to the Nigerian Chess Rating system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter player's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="CM">CM</SelectItem>
                        <SelectItem value="FM">FM</SelectItem>
                        <SelectItem value="IM">IM</SelectItem>
                        <SelectItem value="GM">GM</SelectItem>
                        <SelectItem value="WCM">WCM</SelectItem>
                        <SelectItem value="WFM">WFM</SelectItem>
                        <SelectItem value="WIM">WIM</SelectItem>
                        <SelectItem value="WGM">WGM</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="M">Male</SelectItem>
                        <SelectItem value="F">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Classical Rating</FormLabel>
                    <FormControl>
                      <Input type="number" min={800} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="birthYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Birth Year (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="YYYY" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rapidRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rapid Rating (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={800} 
                        placeholder="Rapid rating" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="blitzRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blitz Rating (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={800} 
                        placeholder="Blitz rating" 
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value ? parseInt(e.target.value) : undefined;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State (Optional)</FormLabel>
                  <FormControl>
                    <StateSelector
                      value={field.value || ""}
                      onValueChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
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
