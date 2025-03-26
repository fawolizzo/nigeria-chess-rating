
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { getPlayerById, Player } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import NewPlayerProfileHeader from "@/components/player/NewPlayerProfileHeader";
import NewPlayerProfileContent from "@/components/player/NewPlayerProfileContent";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [player, setPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Directly load the player data on component mount
  useEffect(() => {
    console.log("[PlayerProfile] Loading player data for ID:", id);
    
    if (!id) {
      setError("No player ID provided");
      toast({
        title: "Missing Information",
        description: "No player ID was provided.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Direct approach to fetch player data
      const playerData = getPlayerById(id);
      
      if (playerData) {
        console.log("[PlayerProfile] Player data loaded successfully:", playerData.id);
        setPlayer(playerData);
        
        // Cache the player data for future reference
        try {
          localStorage.setItem(`player_${id}`, JSON.stringify(playerData));
        } catch (cacheError) {
          console.warn("[PlayerProfile] Could not cache player data:", cacheError);
        }
      } else {
        console.error("[PlayerProfile] Player not found with ID:", id);
        setError("Player not found. Please check the ID and try again.");
        toast({
          title: "Player Not Found",
          description: "The requested player could not be found.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("[PlayerProfile] Error loading player:", error);
      setError(`Error loading player data: ${error.message || "Unknown error"}`);
      toast({
        title: "Error",
        description: "There was a problem loading the player data.",
        variant: "destructive",
      });
    }
  }, [id, toast]);
  
  const handleBackToPlayers = () => {
    navigate("/players");
  };
  
  // If there's an error, show an error message
  if (error) {
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
              <h2 className="text-2xl font-bold mb-2">Error Loading Player</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
              <Button onClick={handleBackToPlayers}>
                Return to Players List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // If there's no player data yet, show a very minimal loading indicator
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
          
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-nigeria-green/20 shadow-card p-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-1/3"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2 w-1/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-1/5"></div>
              <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // If we have the player data, render the profile
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
