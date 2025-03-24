
// Utility function to calculate K-factor for Elo calculation
export const getKFactor = (rating: number, gamesPlayed: number): number => {
  // New or provisional players (fewer than 30 rated games)
  if (gamesPlayed < 30) {
    return 40;
  }
  
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
  result: "1-0" | "0-1" | "1/2-1/2" | "*" | "1F-0" | "0-1F" | "0F-0F";
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
    if (match.result === "*") {
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

    // Use the correct K-factors based solely on rating and games played
    // without special handling for +100 ratings
    const kFactorWhite = getKFactor(whiteRating, whiteGamesPlayed);
    const kFactorBlack = getKFactor(blackRating, blackGamesPlayed);

    const expectedScoreWhite = calculateExpectedScore(whiteRating, blackRating);
    const expectedScoreBlack = calculateExpectedScore(blackRating, whiteRating);

    let scoreWhite = 0;
    let scoreBlack = 0;

    // Handle all possible result types including forfeits
    if (result === "1-0") {
      scoreWhite = 1;
      scoreBlack = 0;
    } else if (result === "0-1") {
      scoreWhite = 0;
      scoreBlack = 1;
    } else if (result === "1/2-1/2") {
      scoreWhite = 0.5;
      scoreBlack = 0.5;
    } else if (result === "1F-0") {
      // White wins by forfeit - White gets full point, Black gets zero
      scoreWhite = 1;
      scoreBlack = 0;
    } else if (result === "0-1F") {
      // Black wins by forfeit - Black gets full point, White gets zero
      scoreWhite = 0;
      scoreBlack = 1;
    } else if (result === "0F-0F") {
      // Double forfeit - both players get zero
      scoreWhite = 0;
      scoreBlack = 0;
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

    return {
      ...match,
      whiteRatingChange,
      blackRatingChange
    };
  });
};
