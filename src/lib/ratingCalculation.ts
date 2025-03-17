
// Calculate rating change using Nigerian Chess Rating System formula
export function calculateRatingChange(playerRating: number, opponentRating: number, result: number, gamesPlayed: number): number {
  // Determine K-factor based on player experience and rating
  let kFactor = 32; // Default K-factor
  
  if (gamesPlayed < 30) {
    kFactor = 40; // Higher K-factor for new players
  } else if (playerRating >= 2100 && playerRating < 2400) {
    kFactor = 24; // Lower K-factor for higher-rated players
  } else if (playerRating >= 2400) {
    kFactor = 16; // Even lower K-factor for masters
  }
  
  // Calculate expected score
  const ratingDiff = opponentRating - playerRating;
  const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
  
  // Calculate rating change
  const ratingChange = Math.round(kFactor * (result - expectedScore));
  
  return ratingChange;
}

// Utility function to get K-factor based on rating and games played
export function getKFactor(playerRating: number, gamesPlayed: number): number {
  if (gamesPlayed < 30) {
    return 40; // Higher K-factor for new players
  } else if (playerRating >= 2100 && playerRating < 2400) {
    return 24; // Lower K-factor for higher-rated players
  } else if (playerRating >= 2400) {
    return 16; // Even lower K-factor for masters
  }
  return 32; // Default K-factor
}

// Calculate post-round ratings for all players in a round
export function calculatePostRoundRatings(
  matches: Array<{
    whiteId: string;
    blackId: string;
    whiteRating: number;
    blackRating: number;
    whiteGamesPlayed: number;
    blackGamesPlayed: number;
    result: "1-0" | "0-1" | "1/2-1/2" | "*";
  }>
): Array<{
  whiteId: string;
  blackId: string;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  whiteRatingChange: number;
  blackRatingChange: number;
}> {
  return matches.map(match => {
    // Skip unfinished games
    if (match.result === "*") {
      return {
        ...match,
        whiteRatingChange: 0,
        blackRatingChange: 0
      };
    }
    
    // Convert result to numerical values
    let whiteResult = 0.5; // Default for draw
    let blackResult = 0.5;
    
    if (match.result === "1-0") {
      whiteResult = 1;
      blackResult = 0;
    } else if (match.result === "0-1") {
      whiteResult = 0;
      blackResult = 1;
    }
    
    // Calculate rating changes
    const whiteRatingChange = calculateRatingChange(
      match.whiteRating,
      match.blackRating,
      whiteResult,
      match.whiteGamesPlayed
    );
    
    const blackRatingChange = calculateRatingChange(
      match.blackRating,
      match.whiteRating,
      blackResult,
      match.blackGamesPlayed
    );
    
    return {
      whiteId: match.whiteId,
      blackId: match.blackId,
      result: match.result,
      whiteRatingChange,
      blackRatingChange
    };
  });
}
