
// Utility function to calculate K-factor for Elo calculation
export const getKFactor = (rating: number, gamesPlayed: number): number => {
  // Check if player has a rating ending with +100 (e.g., 1400+100)
  // These players should be treated as having 30+ games
  const hasPlus100 = String(rating).endsWith('100');
  
  // Players with +100 rating or 30+ games are treated as established players
  if (hasPlus100 || gamesPlayed >= 30) {
    // Players below 2100 get K=32
    if (rating < 2100) {
      return 32;
    }
    
    // Players 2100-2399 get K=24
    if (rating >= 2100 && rating <= 2399) {
      return 24;
    }
    
    // Higher rated players (2400+) get K=16
    return 16;
  }
  
  // New or provisional players (fewer than 10 rated games)
  if (gamesPlayed < 10 && rating < 2000) {
    return 40;
  }
  
  // Default K-factor for other players
  return 32;
};

// Floor rating constant
export const FLOOR_RATING = 800;

interface Match {
  whiteId: string;
  blackId: string;
  whiteRating: number;
  blackRating: number;
  whiteGamesPlayed: number;
  blackGamesPlayed: number;
  result: "1-0" | "0-1" | "1/2-1/2" | "*" | "1F-0F" | "0F-1F" | "0F-0F";
  whiteRatingChange?: number;
  blackRatingChange?: number;
}

interface RatingCalculationResult {
  whiteRatingChange: number;
  blackRatingChange: number;
}

// Calculate the expected score using the Elo formula:
// E = 1 / (1 + 10^((OpponentRating - PlayerRating)/400))
const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

// Calculate rating change using:
// New Rating = Current Rating + K × (Score - E)
const calculateRatingChange = (
  score: number,
  expectedScore: number,
  kFactor: number
): number => {
  return Math.round(kFactor * (score - expectedScore));
};

export const calculatePostRoundRatings = (matches: Match[]): Match[] => {
  return matches.map(match => {
    // If match not played or double forfeit, no rating change
    if (match.result === "*" || match.result === "0F-0F") {
      return {
        ...match,
        whiteRatingChange: 0,
        blackRatingChange: 0
      };
    }

    const {
      whiteRating,
      blackRating,
      whiteGamesPlayed,
      blackGamesPlayed,
      result
    } = match;

    // Adjust games played for players with +100 ratings
    const hasWhitePlus100 = String(whiteRating).endsWith('100');
    const hasBlackPlus100 = String(blackRating).endsWith('100');
    
    const adjustedWhiteGamesPlayed = hasWhitePlus100 ? Math.max(31, whiteGamesPlayed) : whiteGamesPlayed;
    const adjustedBlackGamesPlayed = hasBlackPlus100 ? Math.max(31, blackGamesPlayed) : blackGamesPlayed;

    const kFactorWhite = getKFactor(whiteRating, adjustedWhiteGamesPlayed);
    const kFactorBlack = getKFactor(blackRating, adjustedBlackGamesPlayed);

    const expectedScoreWhite = calculateExpectedScore(whiteRating, blackRating);
    const expectedScoreBlack = calculateExpectedScore(blackRating, whiteRating);

    let scoreWhite = 0;
    let scoreBlack = 0;

    // Handle all result types including forfeits
    if (result === "1-0" || result === "1F-0F") {
      scoreWhite = 1;
      scoreBlack = 0;
    } else if (result === "0-1" || result === "0F-1F") {
      scoreWhite = 0;
      scoreBlack = 1;
    } else if (result === "1/2-1/2") {
      scoreWhite = 0.5;
      scoreBlack = 0.5;
    }

    const whiteRatingChange = calculateRatingChange(
      scoreWhite,
      expectedScoreWhite,
      kFactorWhite
    );
    const blackRatingChange = calculateRatingChange(
      scoreBlack,
      expectedScoreBlack,
      kFactorBlack
    );

    // Store the match result details for individual game rating history
    const matchDetails = {
      whiteId: match.whiteId,
      blackId: match.blackId,
      whiteRating: match.whiteRating,
      blackRating: match.blackRating,
      result: match.result,
      whiteRatingChange,
      blackRatingChange,
      date: new Date().toISOString()
    };

    return {
      ...match,
      whiteRatingChange,
      blackRatingChange,
      matchDetails
    };
  });
};
