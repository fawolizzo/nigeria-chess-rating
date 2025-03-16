import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/components/ui/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { importPlayerFromLichess } from "@/lib/lichessApi";
import { addPlayer, Player } from "@/lib/mockData";

const formSchema = z.object({
  username: z.string().min(2, {
    message: "Lichess username must be at least 2 characters.",
  }),
});

interface LichessPlayerImportProps {
  onPlayerImported?: (player: Player) => void;
}

const LichessPlayerImport = ({ onPlayerImported }: LichessPlayerImportProps) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const lichessPlayerData = await importPlayerFromLichess(values.username);
      
      // Generate a unique ID for the player
      const newPlayer: Player = {
        id: `player_${Date.now()}`,
        ...lichessPlayerData,
        state: "Lagos", // Default value, can be changed later
        federationId: "",
        ratingHistory: [
          {
            date: new Date().toISOString().split('T')[0],
            rating: lichessPlayerData.rating,
            reason: "Imported from Lichess"
          }
        ],
        tournamentResults: []
      };
      
      // Add the player to the system
      addPlayer(newPlayer);
      
      toast({
        title: "Player imported successfully",
        description: `${newPlayer.name}${newPlayer.title ? ` (${newPlayer.title})` : ""} has been imported with a rating of ${newPlayer.rating}.`,
      });
      
      // Clear the form
      form.reset();
      
      // Notify parent component
      if (onPlayerImported) {
        onPlayerImported(newPlayer);
      }
    } catch (error) {
      console.error("Error importing player:", error);
      
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Failed to import player from Lichess",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Player from Lichess</CardTitle>
        <CardDescription>
          Enter a Lichess username to import their rating and profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lichess Username</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter username" {...field} />
                  </FormControl>
                  <FormDescription>
                    The player's username on Lichess.org
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Import Player
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default LichessPlayerImport;
