
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlayerById } from "@/lib/mockData";
import Navbar from "@/components/Navbar";
import { Player } from "@/lib/mockData";
import PlayerProfileContent from "@/components/player/PlayerProfileContent";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import { Pencil, ArrowLeft, Check, Loader2 } from "lucide-react";
import EditPlayerDialog from "@/components/officer/EditPlayerDialog";

const PlayerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { currentUser } = useUser();

  // Check if the current user is a rating officer
  const isRatingOfficer = currentUser?.role === 'rating_officer';

  useEffect(() => {
    if (id) {
      try {
        const loadedPlayer = getPlayerById(id);
        console.log("Loaded player:", loadedPlayer);
        
        if (loadedPlayer) {
          // Ensure player has all required fields
          if (!loadedPlayer.tournamentResults) {
            loadedPlayer.tournamentResults = [];
          }
          
          // Ensure player has rapid and blitz ratings
          if (!loadedPlayer.rapidRating) {
            loadedPlayer.rapidRating = 800;
            loadedPlayer.rapidGamesPlayed = 0;
            loadedPlayer.rapidRatingStatus = 'provisional';
            loadedPlayer.rapidRatingHistory = [{
              date: new Date().toISOString(),
              rating: 800,
              reason: "Initial rating"
            }];
          }
          
          if (!loadedPlayer.blitzRating) {
            loadedPlayer.blitzRating = 800;
            loadedPlayer.blitzGamesPlayed = 0;
            loadedPlayer.blitzRatingStatus = 'provisional';
            loadedPlayer.blitzRatingHistory = [{
              date: new Date().toISOString(),
              rating: 800,
              reason: "Initial rating"
            }];
          }
          
          setPlayer(loadedPlayer);
        } else {
          console.error("Player not found with ID:", id);
          navigate("/players");
        }
      } catch (error) {
        console.error("Error loading player:", error);
        navigate("/players");
      }
    } else {
      navigate("/players");
    }
    setIsLoading(false);
  }, [id, navigate]);

  const handleEditSuccess = () => {
    // Reload player data after successful edit
    if (id) {
      const updatedPlayer = getPlayerById(id);
      if (updatedPlayer) {
        setPlayer(updatedPlayer);
      }
    }
  };

  const handleBackToPlayers = () => {
    navigate("/players");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 text-nigeria-green animate-spin mb-4" />
          <div className="text-lg font-medium">Loading Player Profile...</div>
        </div>
      </div>
    );
  }

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
          
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold mb-2">Player Not Found</h1>
            <p className="text-gray-500 mb-6">The player you are looking for doesn't exist or has been removed.</p>
            <Button onClick={handleBackToPlayers}>
              Return to Players List
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Check if player has verified title
  const isTitleVerified = player.titleVerified && player.title;

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
          <div className="bg-gradient-nigeria-subtle p-6 md:p-8 border-b border-nigeria-green/10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-nigeria-green/10 dark:bg-nigeria-green/20 rounded-full flex items-center justify-center text-2xl font-bold text-nigeria-green dark:text-nigeria-green-light relative">
                  {player.name.charAt(0)}
                  {player.title && (
                    <div className="absolute -top-1 -right-1 bg-nigeria-yellow text-nigeria-black-soft text-xs font-bold py-0.5 px-1.5 rounded-full border border-white dark:border-gray-800">
                      {player.title}
                    </div>
                  )}
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {player.title && (
                      <span className="text-gold-dark dark:text-gold-light mr-2">{player.title}</span>
                    )}
                    {player.name}
                    {isTitleVerified && (
                      <span className="inline-flex items-center justify-center bg-blue-500 rounded-full w-6 h-6">
                        <Check className="h-4 w-4 text-white" strokeWidth={3} />
                      </span>
                    )}
                  </h1>
                  <div className="flex flex-wrap items-center text-gray-500 dark:text-gray-400 mt-1 gap-x-2">
                    <span className="font-medium text-nigeria-green dark:text-nigeria-green-light">Rating: {player.rating}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>ID: {player.id}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{player.country || "Nigeria"}</span>
                    {player.state && (
                      <>
                        <span className="hidden sm:inline">•</span>
                        <span>{player.state}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {isRatingOfficer && (
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 border-nigeria-green/30 text-nigeria-green hover:bg-nigeria-green/5 hover:text-nigeria-green-dark dark:border-nigeria-green/40 dark:text-nigeria-green-light"
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Pencil size={16} />
                  Edit Player
                </Button>
              )}
            </div>
          </div>
          
          <div className="p-6 md:p-8">
            {player && <PlayerProfileContent player={player} />}
          </div>
        </div>
      </div>

      {isRatingOfficer && player && (
        <EditPlayerDialog 
          player={player} 
          isOpen={isEditDialogOpen} 
          onOpenChange={setIsEditDialogOpen}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default PlayerProfile;
