// Basic Elo rating calculation parameters
export const FLOOR_RATING = 800;

// K-factor for different player categories
export const K_FACTORS = {
  NEW_PLAYER: 40,   // For players with less than 30 games
  UNDER_2100: 32,   // For players rated below 2100
  BETWEEN_2100_AND_2400: 24, // For players between 2100-2399
  ABOVE_2400: 16    // For players rated 2400 and above
};

// Expected score calculation (probability of winning)
export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

// Determine K-factor based on player's experience and rating
export function getKFactor(rating: number, gamesPlayed: number): number {
  if (gamesPlayed < 30) return K_FACTORS.NEW_PLAYER;
  if (rating < 2100) return K_FACTORS.UNDER_2100;
  if (rating < 2400) return K_FACTORS.BETWEEN_2100_AND_2400;
  return K_FACTORS.ABOVE_2400;
}

// Calculate new rating after a match
export function calculateNewRating(playerRating: number, opponentRating: number, result: number, kFactor: number): number {
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  const newRating = Math.round(playerRating + kFactor * (result - expectedScore));
  
  // Enforce rating floor
  return Math.max(newRating, FLOOR_RATING);
}

// Calculate new ratings for all players in a tournament
export function calculateNewRatings(players: any[], matches: any[]): any[] {
  // This is a placeholder implementation
  // In a real system, this would process all matches and calculate rating changes
  return players.map(player => {
    const initialRating = player.rating || FLOOR_RATING;
    // Generate a random rating change for demonstration
    const ratingChange = Math.floor(Math.random() * 40) - 20; 
    const finalRating = Math.max(initialRating + ratingChange, FLOOR_RATING);
    
    return {
      playerId: player.id,
      initialRating,
      finalRating,
      ratingChange
    };
  });
}
