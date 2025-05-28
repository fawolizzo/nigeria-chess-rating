
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import { Player } from "@/lib/mockData";
import { getPlayerByIdFromSupabase } from "@/services/playerService";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import NewPlayerProfileHeader from "@/components/player/NewPlayerProfileHeader";
import NewPlayerProfileContent from "@/components/player/NewPlayerProfileContent";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!id) {
        setFetchError("No player ID provided.");
        setIsLoading(false);
        toast({
          title: "Missing Information",
          description: "No player ID was provided in the URL.",
          variant: "destructive",
        });
        return;
      }

      setIsLoading(true);
      setFetchError(null);
      console.log("[PlayerProfile] Fetching player data for ID:", id);

      try {
        const playerData = await getPlayerByIdFromSupabase(id);
        
        if (playerData) {
          console.log("[PlayerProfile] Player data fetched successfully:", playerData.id);
          // Add mock rating history if none exists
          if (!playerData.ratingHistory || playerData.ratingHistory.length === 0) {
            playerData.ratingHistory = [{
              date: new Date().toISOString(),
              rating: playerData.rating,
              reason: "Initial rating"
            }];
          }
          
          if (!playerData.rapidRatingHistory || playerData.rapidRatingHistory.length === 0) {
            playerData.rapidRatingHistory = [{
              date: new Date().toISOString(),
              rating: playerData.rapidRating || 800,
              reason: "Initial rapid rating"
            }];
          }
          
          if (!playerData.blitzRatingHistory || playerData.blitzRatingHistory.length === 0) {
            playerData.blitzRatingHistory = [{
              date: new Date().toISOString(),
              rating: playerData.blitzRating || 800,
              reason: "Initial blitz rating"
            }];
          }
          
          setPlayer(playerData);
        } else {
          console.warn("[PlayerProfile] Player not found with ID via Supabase:", id);
          setFetchError("Player not found. The profile may not exist or the ID is incorrect.");
          setPlayer(null);
          toast({
            title: "Player Not Found",
            description: "The requested player could not be found.",
            variant: "default",
          });
        }
      } catch (err: any) {
        console.error("[PlayerProfile] Error fetching player from Supabase:", err);
        setFetchError(`Failed to load player profile: ${err.message || "An unexpected error occurred."}`);
        setPlayer(null);
        toast({
          title: "Error Loading Profile",
          description: "There was a problem fetching the player data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [id, toast]);
  
  const handleBackToPlayers = () => {
    navigate("/players");
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-nigeria-green mb-4" />
          <h2 className="text-xl font-medium">Loading Player Profile...</h2>
          <p className="text-muted-foreground">Please wait while we fetch the details.</p>
        </div>
      </div>
    );
  }
  
  // If there's a fetchError, show an error message
  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6 text-nigeria-green hover:text-nigeria-green-dark hover:bg-nigeria-green/5 -ml-2" 
            onClick={handleBackToPlayers}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Players
          </Button>
          
          <Card className="border-red-200 dark:border-red-800">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Error Loading Profile</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{fetchError}</p>
              <Button onClick={handleBackToPlayers}>
                Return to Players List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If not loading, no error, but player is still null (e.g. player not found but not treated as fetchError by above)
  if (!player) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Navbar />
        <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
          <Button 
            variant="ghost" 
            className="mb-6 text-nigeria-green hover:text-nigeria-green-dark hover:bg-nigeria-green/5 -ml-2" 
            onClick={handleBackToPlayers}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Players
          </Button>
          
          <Card className="border-yellow-400 dark:border-yellow-700">
            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
              <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Player Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                The player profile you are looking for does not exist or could not be loaded.
              </p>
              <Button onClick={handleBackToPlayers}>
                Return to Players List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If we have the player data (!isLoading, !fetchError, player is not null), render the profile
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6 text-nigeria-green hover:text-nigeria-green-dark hover:bg-nigeria-green/5 -ml-2" 
          onClick={handleBackToPlayers}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Players
        </Button>
        
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-nigeria-green/20 shadow-card overflow-hidden">
          <NewPlayerProfileHeader player={player} />
          <div className="p-6 md:p-8">
            <NewPlayerProfileContent player={player} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
