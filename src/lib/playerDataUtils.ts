
import { Player } from "@/lib/mockData";

// Debug function to log player data details
export const debugPlayer = (player: any) => {
  console.log("Player data details:", {
    id: player.id,
    name: player.name,
    rating: player.rating,
    ratingHistory: player.ratingHistory,
    tournamentResults: player.tournamentResults,
    rapidRating: player.rapidRating,
    blitzRating: player.blitzRating
  });
};

// Ensure player has all required fields with proper initialization
export const initializePlayerData = (playerData: any): Player => {
  if (!playerData) return null;
  
  // Create a deep copy to avoid reference issues
  const playerCopy = JSON.parse(JSON.stringify(playerData));
  
  return {
    ...playerCopy,
    // Ensure tournament results exists as an array
    tournamentResults: Array.isArray(playerCopy.tournamentResults) 
      ? playerCopy.tournamentResults 
      : [],
    
    // Ensure rating and rating history exist
    rating: playerCopy.rating || 800,
    gamesPlayed: playerCopy.gamesPlayed || 0,
    ratingStatus: playerCopy.ratingStatus || 'provisional',
    ratingHistory: Array.isArray(playerCopy.ratingHistory) && playerCopy.ratingHistory.length > 0
      ? playerCopy.ratingHistory
      : [{
          date: new Date().toISOString(),
          rating: playerCopy.rating || 800,
          reason: "Initial rating"
        }],
    
    // Ensure rapid rating data exists - use 800 as floor rating with no bonus
    rapidRating: playerCopy.rapidRating !== undefined ? playerCopy.rapidRating : 800,
    rapidGamesPlayed: playerCopy.rapidGamesPlayed || 0,
    rapidRatingStatus: playerCopy.rapidRatingStatus || 'provisional',
    rapidRatingHistory: Array.isArray(playerCopy.rapidRatingHistory) && playerCopy.rapidRatingHistory.length > 0
      ? playerCopy.rapidRatingHistory
      : [{
          date: new Date().toISOString(),
          rating: 800,
          reason: "Initial rating"
        }],
    
    // Ensure blitz rating data exists - use 800 as floor rating with no bonus
    blitzRating: playerCopy.blitzRating !== undefined ? playerCopy.blitzRating : 800,
    blitzGamesPlayed: playerCopy.blitzGamesPlayed || 0,
    blitzRatingStatus: playerCopy.blitzRatingStatus || 'provisional',
    blitzRatingHistory: Array.isArray(playerCopy.blitzRatingHistory) && playerCopy.blitzRatingHistory.length > 0
      ? playerCopy.blitzRatingHistory
      : [{
          date: new Date().toISOString(),
          rating: 800,
          reason: "Initial rating"
        }],
  };
};
