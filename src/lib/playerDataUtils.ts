
import { Player } from "@/lib/mockData";
import { FLOOR_RATING } from "@/lib/ratingCalculation";

// Function to generate a unique NCR ID for players
export const generateUniquePlayerID = () => {
  // Get existing IDs from localStorage to check uniqueness
  const existingPlayers = localStorage.getItem('ncr_players');
  const players = existingPlayers ? JSON.parse(existingPlayers) : [];
  const existingIds = players.map((p: Player) => p.id);
  
  let newId;
  do {
    // Format: NCR + 5 random digits
    const randomPart = Math.floor(10000 + Math.random() * 90000);
    newId = `NCR${randomPart}`;
  } while (existingIds.includes(newId));
  
  return newId;
};

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
    
    // Ensure classical rating and rating history exist
    rating: playerCopy.rating || FLOOR_RATING,
    gamesPlayed: playerCopy.gamesPlayed || 0,
    ratingStatus: playerCopy.gamesPlayed >= 30 ? 'established' : 'provisional',
    ratingHistory: Array.isArray(playerCopy.ratingHistory) && playerCopy.ratingHistory.length > 0
      ? playerCopy.ratingHistory
      : [{
          date: new Date().toISOString(),
          rating: playerCopy.rating || FLOOR_RATING,
          reason: "Initial rating"
        }],
    
    // Ensure rapid rating data exists - use FLOOR_RATING without any bonus
    rapidRating: playerCopy.rapidRating !== undefined ? playerCopy.rapidRating : FLOOR_RATING,
    rapidGamesPlayed: playerCopy.rapidGamesPlayed || 0,
    rapidRatingStatus: playerCopy.rapidGamesPlayed >= 30 ? 'established' : 'provisional',
    rapidRatingHistory: Array.isArray(playerCopy.rapidRatingHistory) && playerCopy.rapidRatingHistory.length > 0
      ? playerCopy.rapidRatingHistory
      : [{
          date: new Date().toISOString(),
          rating: FLOOR_RATING,
          reason: "Initial rating"
        }],
    
    // Ensure blitz rating data exists - use FLOOR_RATING without any bonus
    blitzRating: playerCopy.blitzRating !== undefined ? playerCopy.blitzRating : FLOOR_RATING,
    blitzGamesPlayed: playerCopy.blitzGamesPlayed || 0,
    blitzRatingStatus: playerCopy.blitzGamesPlayed >= 30 ? 'established' : 'provisional',
    blitzRatingHistory: Array.isArray(playerCopy.blitzRatingHistory) && playerCopy.blitzRatingHistory.length > 0
      ? playerCopy.blitzRatingHistory
      : [{
          date: new Date().toISOString(),
          rating: FLOOR_RATING,
          reason: "Initial rating"
        }],
  };
};
