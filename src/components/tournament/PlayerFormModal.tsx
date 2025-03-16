import React from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LichessPlayerImport from "@/components/lichess/LichessPlayerImport";

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
  const form = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      name: "",
      title: "",
      gender: "M",
      state: "",
      country: "Nigeria",
      birthYear: String(new Date().getFullYear()),
      club: "",
    },
  });

  const handleCreatePlayer = (data: PlayerFormValues) => {
    const newPlayer: Player = {
      id: `player_${Date.now()}`,
      name: data.name,
      title: data.title && data.title.length > 0 ? data.title : undefined,
      rating: 800,
      country: data.country,
      state: data.state,
      club: data.club && data.club.length > 0 ? data.club : undefined,
      gender: data.gender,
      birthYear: parseInt(data.birthYear),
      ratingHistory: [{ date: new Date().toISOString().split('T')[0], rating: 800 }],
      tournamentResults: [],
      status: 'pending',
      createdBy: currentUserId,
      gamesPlayed: 0
    };
    
    onPlayerCreated(newPlayer);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create New Player</DialogTitle>
          <DialogDescription>
            Add a new player to the Nigerian Chess Rating system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="manual">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
            <TabsTrigger value="lichess">Import from Lichess</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual">
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
                            <SelectItem key={title} value={title}>{title || "None"}</SelectItem>
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
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Player
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="lichess">
            <LichessPlayerImport onPlayerImported={(player) => {
              onPlayerCreated(player);
              onOpenChange(false);
            }} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerFormModal;
