
/**
 * Nigerian Chess Rating System calculation utilities
 * Implements the modified Elo rating system with variable K-factors:
 * - K=40 for new players (< 30 games) with rating below 2300
 * - K=32 for players rated below 2100 (with 30+ games)
 * - K=24 for players rated 2100-2399
 * - K=16 for higher-rated players
 */

const FLOOR_RATING = 800;
const MIN_GAMES_FOR_ESTABLISHED = 30;
const MAX_RATING_FOR_K40 = 2300;

/**
 * Determines the appropriate K-factor based on player's rating and experience
 */
export const getKFactor = (rating: number, gamesPlayed: number): number => {
  // New players with under 30 games BUT only if they're under 2300 rating
  if (gamesPlayed < MIN_GAMES_FOR_ESTABLISHED && rating < MAX_RATING_FOR_K40) {
    return 40; // New player with rating under 2300
  } else if (rating < 2100) {
    return 32; // Below 2100
  } else if (rating < 2400) {
    return 24; // 2100-2399
  } else {
    return 16; // 2400 and above
  }
};

/**
 * Calculates the expected score based on rating difference
 */
export const calculateExpectedScore = (playerRating: number, opponentRating: number): number => {
  return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
};

/**
 * Calculates the rating change after a match
 */
export const calculateRatingChange = (
  playerRating: number,
  opponentRating: number,
  actualScore: number, // 1 for win, 0.5 for draw, 0 for loss
  gamesPlayed: number
): number => {
  const kFactor = getKFactor(playerRating, gamesPlayed);
  const expectedScore = calculateExpectedScore(playerRating, opponentRating);
  const ratingChange = Math.round(kFactor * (actualScore - expectedScore));
  
  // Apply floor rating for new ratings
  const newRating = playerRating + ratingChange;
  if (newRating < FLOOR_RATING) {
    return FLOOR_RATING - playerRating; // Return change that would set rating to floor
  }
  
  return ratingChange;
};

/**
 * Converts match result to actual score for rating calculation
 */
export const resultToScore = (result: "1-0" | "0-1" | "1/2-1/2" | "*"): number => {
  switch (result) {
    case "1-0": return 1;  // White win
    case "0-1": return 0;  // Black win
    case "1/2-1/2": return 0.5;  // Draw
    default: return 0;  // Not played or unknown result
  }
};

/**
 * Updates ratings after a tournament round
 */
export const calculatePostRoundRatings = (
  pairings: Array<{
    whiteId: string;
    blackId: string;
    result: "1-0" | "0-1" | "1/2-1/2" | "*";
    whiteRating: number;
    blackRating: number;
    whiteGamesPlayed: number;
    blackGamesPlayed: number;
  }>
): Array<{
  whiteId: string;
  blackId: string;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  whiteRatingChange: number;
  blackRatingChange: number;
}> => {
  return pairings.map(pairing => {
    // Skip games without results
    if (pairing.result === "*") {
      return {
        ...pairing,
        whiteRatingChange: 0,
        blackRatingChange: 0
      };
    }

    // Calculate scores from results
    const whiteScore = resultToScore(pairing.result);
    const blackScore = 1 - whiteScore;  // Inverse of white score
    
    // Calculate rating changes
    const whiteRatingChange = calculateRatingChange(
      pairing.whiteRating,
      pairing.blackRating,
      whiteScore,
      pairing.whiteGamesPlayed
    );
    
    const blackRatingChange = calculateRatingChange(
      pairing.blackRating,
      pairing.whiteRating,
      blackScore,
      pairing.blackGamesPlayed
    );
    
    return {
      whiteId: pairing.whiteId,
      blackId: pairing.blackId,
      result: pairing.result,
      whiteRatingChange,
      blackRatingChange
    };
  });
};
