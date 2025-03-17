// Utility function to calculate K-factor for Elo calculation
export const getKFactor = (rating: number, gamesPlayed: number): number => {
  // New players (< 30 games) get K=40 if rated below 2300
  if (gamesPlayed < 30 && rating < 2300) {
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
  
  // Higher rated players get K=16
  return 16;
};

interface Match {
  whiteId: string;
  blackId: string;
  whiteRating: number;
  blackRating: number;
  whiteGamesPlayed: number;
  blackGamesPlayed: number;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
  whiteRatingChange?: number;
  blackRatingChange?: number;
}

interface RatingCalculationResult {
  whiteRatingChange: number;
  blackRatingChange: number;
}

const calculateExpectedScore = (ratingA: number, ratingB: number): number => {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
};

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

    const kFactorWhite = getKFactor(whiteRating, whiteGamesPlayed);
    const kFactorBlack = getKFactor(blackRating, blackGamesPlayed);

    const expectedScoreWhite = calculateExpectedScore(whiteRating, blackRating);
    const expectedScoreBlack = calculateExpectedScore(blackRating, whiteRating);

    let scoreWhite = 0;
    let scoreBlack = 0;

    if (result === "1-0") {
      scoreWhite = 1;
      scoreBlack = 0;
    } else if (result === "0-1") {
      scoreWhite = 0;
      scoreBlack = 1;
    } else {
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

    return {
      ...match,
      whiteRatingChange,
      blackRatingChange
    };
  });
};
