
import React, { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Player } from "@/lib/mockData";
import { toast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const playerSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  title: z.string().optional(),
  gender: z.enum(["M", "F"], { message: "Please select a gender" }),
  state: z.string().min(1, { message: "State is required" }),
  country: z.string().default("Nigeria"),
  birthYear: z.string().refine(val => {
    const year = parseInt(val);
    return !isNaN(year) && year > 1900 && year <= new Date().getFullYear();
  }, { message: "Please enter a valid birth year" }),
  club: z.string().optional(),
  applyBonus: z.boolean().default(false),
  establishedRating: z.boolean().default(false)
});

type PlayerFormValues = z.infer<typeof playerSchema>;

interface PlayerFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerCreated: (player: Player) => void;
  currentUserId: string;
}

const chessTitles = ["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM", " "];

const PlayerFormModal = ({ isOpen, onOpenChange, onPlayerCreated, currentUserId }: PlayerFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "",
      gender: "M",
      state: "",
      country: "Nigeria",
      birthYear: "",
      club: "",
      applyBonus: false,
      establishedRating: false
    },
  });

  // Generate a unique NCR ID for the player (4 digits)
  const generateNcrId = () => {
    const randomPart = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    return `NCR${randomPart}`;
  };

  const handleCreatePlayer = (data: PlayerFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Determine rating based on bonus
      const baseRating = 800;
      const finalRating = data.applyBonus ? baseRating + 100 : baseRating;
      
      // Determine status
      let status: 'pending' | 'approved' = 'pending';
      
      // If current user is a rating officer, auto-approve the player
      if (currentUserId && currentUserId.includes('officer')) {
        status = 'approved';
      }
      
      // Create a new player
      const newPlayer: Player = {
        id: generateNcrId(),
        name: data.name,
        gender: data.gender,
        rating: finalRating,
        gamesPlayed: data.establishedRating ? 31 : 1,
        ratingStatus: data.establishedRating ? 'established' : 'provisional',
        state: data.state || undefined,
        country: "Nigeria",
        status: status,
        ratingHistory: [
          {
            date: new Date().toISOString(),
            rating: finalRating,
            reason: data.applyBonus ? "Initial rating with +100 bonus" : "Initial registration"
          }
        ],
        tournamentResults: []
      };
      
      // Add title if selected
      if (data.title && data.title.trim() !== "" && data.title !== " ") {
        newPlayer.title = data.title;
        
        // Auto-verify official titles
        if (["GM", "IM", "FM", "CM", "WGM", "WIM", "WFM", "WCM"].includes(data.title)) {
          newPlayer.titleVerified = true;
        }
      }
      
      // Add optional fields if provided
      if (data.club && data.club.trim() !== "") {
        newPlayer.club = data.club;
      }
      
      if (data.birthYear) {
        newPlayer.birthYear = parseInt(data.birthYear);
      }
      
      // Also set rapid and blitz ratings to floor rating
      newPlayer.rapidRating = data.applyBonus ? baseRating + 100 : baseRating;
      newPlayer.rapidGamesPlayed = data.establishedRating ? 31 : 1;
      newPlayer.rapidRatingStatus = data.establishedRating ? 'established' : 'provisional';
      newPlayer.rapidRatingHistory = [{
        date: new Date().toISOString(),
        rating: newPlayer.rapidRating,
        reason: data.applyBonus ? "Initial rating with +100 bonus" : "Initial registration"
      }];
      
      newPlayer.blitzRating = data.applyBonus ? baseRating + 100 : baseRating;
      newPlayer.blitzGamesPlayed = data.establishedRating ? 31 : 1;
      newPlayer.blitzRatingStatus = data.establishedRating ? 'established' : 'provisional';
      newPlayer.blitzRatingHistory = [{
        date: new Date().toISOString(),
        rating: newPlayer.blitzRating,
        reason: data.applyBonus ? "Initial rating with +100 bonus" : "Initial registration"
      }];
      
      onPlayerCreated(newPlayer);
      
      toast({
        title: "Player created",
        description: status === 'approved' 
          ? "The player has been created and approved."
          : "The player has been created with pending status and will need approval from a Rating Officer.",
      });
      
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating player:", error);
      toast({
        title: "Error",
        description: "Failed to create player. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the Nigerian Chess Rating system
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleCreatePlayer)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select title (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chessTitles.map(title => (
                          <SelectItem key={title} value={title}>{title === " " ? "None" : title}</SelectItem>
                        ))}
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="State" {...field} />
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
                    <FormLabel>Birth Year</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1990" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="club"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Club name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md space-y-4">
              <h3 className="font-medium text-md">Rating Options</h3>
              
              <FormField
                control={form.control}
                name="applyBonus"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Apply +100 Rating Bonus</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Adds 100 points to the player's initial rating in all formats and treats them as established
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="establishedRating"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark as Established Player</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Player will start with 31 games played and be considered established in all formats
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Player"}
              </Button>
            </div>
          </form>
        </Form>
        
        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 rounded-md text-sm">
          <p className="font-bold">Note:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>All new players will be assigned a unique NCR ID</li>
            <li>The floor rating of 800 applies to all formats</li>
            <li>Players with official chess titles (GM, IM, FM, etc.) will automatically receive a verified badge</li>
            <li>New players start with 1 game played and become established after 30 games</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerFormModal;
