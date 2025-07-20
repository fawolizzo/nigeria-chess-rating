/**
 * Nigerian Chess Rating System Utilities
 *
 * This module implements the official Nigerian Chess Rating logic:
 * - Each player gets +100 points in any rating format they already have a rating in
 * - If player has no rating in a format, that format is assigned floor rating of 800
 * - Provisional ratings are assigned after 30 games are completed in that format
 */

export interface PlayerRatings {
  rating: number; // Classical rating
  rapidRating: number; // Rapid rating
  blitzRating: number; // Blitz rating
  gamesPlayed: number; // Classical games played
  rapidGamesPlayed: number; // Rapid games played
  blitzGamesPlayed: number; // Blitz games played
}

export interface RatingUpdate {
  rating: number;
  rapidRating: number;
  blitzRating: number;
  gamesPlayed: number;
  rapidGamesPlayed: number;
  blitzGamesPlayed: number;
}

/**
 * Floor rating for unrated players in any format
 */
export const FLOOR_RATING = 800;

/**
 * Minimum rating to qualify for bonus (801+)
 */
export const MINIMUM_RATING_FOR_BONUS = 801;

/**
 * Rating bonus applied to established ratings
 */
export const RATING_BONUS = 100;

/**
 * Games required to establish a provisional rating
 */
export const PROVISIONAL_GAMES_REQUIRED = 30;

/**
 * Check if a rating qualifies for bonus (801 or above)
 */
export const isEstablishedRating = (rating: number): boolean => {
  return rating >= MINIMUM_RATING_FOR_BONUS;
};

/**
 * Check if a rating is at floor level (800 or below)
 */
export const isFloorRating = (rating: number): boolean => {
  return rating <= FLOOR_RATING;
};

/**
 * Check if a player has completed enough games for provisional rating
 */
export const hasProvisionalRating = (gamesPlayed: number): boolean => {
  return gamesPlayed >= PROVISIONAL_GAMES_REQUIRED;
};

/**
 * Apply Nigerian Chess Rating upload logic to a player's ratings
 *
 * Rules:
 * - Each player gets +100 points in any rating format they already have a rating in (801+)
 * - If player has no rating in a format (800 or below), that format stays at 800 (no bonus)
 * - Game counts reflect established vs unrated status
 */
export const applyRatingUpload = (
  currentRatings: PlayerRatings
): RatingUpdate => {
  const update: RatingUpdate = {
    rating: currentRatings.rating,
    rapidRating: currentRatings.rapidRating,
    blitzRating: currentRatings.blitzRating,
    gamesPlayed: currentRatings.gamesPlayed,
    rapidGamesPlayed: currentRatings.rapidGamesPlayed,
    blitzGamesPlayed: currentRatings.blitzGamesPlayed,
  };

  // Classical rating: Apply +100 bonus if established, otherwise keep floor rating
  if (isEstablishedRating(currentRatings.rating)) {
    update.rating = currentRatings.rating + RATING_BONUS;
    update.gamesPlayed = Math.max(
      currentRatings.gamesPlayed,
      PROVISIONAL_GAMES_REQUIRED
    );
  } else {
    update.rating = FLOOR_RATING;
    update.gamesPlayed = 0; // Floor rating = no games played yet
  }

  // Rapid rating: Apply +100 bonus if established, otherwise keep floor rating
  if (isEstablishedRating(currentRatings.rapidRating)) {
    update.rapidRating = currentRatings.rapidRating + RATING_BONUS;
    update.rapidGamesPlayed = Math.max(
      currentRatings.rapidGamesPlayed,
      PROVISIONAL_GAMES_REQUIRED
    );
  } else {
    update.rapidRating = FLOOR_RATING;
    update.rapidGamesPlayed = 0; // Floor rating = no games played yet
  }

  // Blitz rating: Apply +100 bonus if established, otherwise keep floor rating
  if (isEstablishedRating(currentRatings.blitzRating)) {
    update.blitzRating = currentRatings.blitzRating + RATING_BONUS;
    update.blitzGamesPlayed = Math.max(
      currentRatings.blitzGamesPlayed,
      PROVISIONAL_GAMES_REQUIRED
    );
  } else {
    update.blitzRating = FLOOR_RATING;
    update.blitzGamesPlayed = 0; // Floor rating = no games played yet
  }

  return update;
};

/**
 * Initialize ratings for a new player
 * All formats start at floor rating with 0 games
 */
export const initializeNewPlayerRatings = (): PlayerRatings => {
  return {
    rating: FLOOR_RATING,
    rapidRating: FLOOR_RATING,
    blitzRating: FLOOR_RATING,
    gamesPlayed: 0,
    rapidGamesPlayed: 0,
    blitzGamesPlayed: 0,
  };
};

/**
 * Fix game counts based on current ratings
 * This ensures game counts properly reflect established vs unrated status
 */
export const fixGameCounts = (
  currentRatings: PlayerRatings
): Partial<PlayerRatings> => {
  const updates: Partial<PlayerRatings> = {};

  // Classical: 30 games if established rating (801+), 0 games if floor rating (800 or below)
  const correctClassicalGames = isEstablishedRating(currentRatings.rating)
    ? PROVISIONAL_GAMES_REQUIRED
    : 0;
  if (currentRatings.gamesPlayed !== correctClassicalGames) {
    updates.gamesPlayed = correctClassicalGames;
  }

  // Rapid: 30 games if established rating (801+), 0 games if floor rating (800 or below)
  const correctRapidGames = isEstablishedRating(currentRatings.rapidRating)
    ? PROVISIONAL_GAMES_REQUIRED
    : 0;
  if (currentRatings.rapidGamesPlayed !== correctRapidGames) {
    updates.rapidGamesPlayed = correctRapidGames;
  }

  // Blitz: 30 games if established rating (801+), 0 games if floor rating (800 or below)
  const correctBlitzGames = isEstablishedRating(currentRatings.blitzRating)
    ? PROVISIONAL_GAMES_REQUIRED
    : 0;
  if (currentRatings.blitzGamesPlayed !== correctBlitzGames) {
    updates.blitzGamesPlayed = correctBlitzGames;
  }

  return updates;
};

/**
 * Get rating status for display purposes
 */
export const getRatingStatus = (
  rating: number,
  gamesPlayed: number
): 'unrated' | 'provisional' | 'established' => {
  if (isFloorRating(rating)) {
    return 'unrated';
  } else if (gamesPlayed >= PROVISIONAL_GAMES_REQUIRED) {
    return 'established';
  } else {
    return 'provisional';
  }
};

/**
 * Format rating for display with status indicator
 */
export const formatRatingDisplay = (
  rating: number,
  gamesPlayed: number
): string => {
  const status = getRatingStatus(rating, gamesPlayed);

  switch (status) {
    case 'unrated':
      return 'Unrated';
    case 'provisional':
      return `${rating} (Provisional)`;
    case 'established':
      return `${rating}`;
    default:
      return `${rating}`;
  }
};

/**
 * Validate rating update according to Nigerian Chess Rating rules
 */
export const validateRatingUpdate = (
  oldRatings: PlayerRatings,
  newRatings: PlayerRatings
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check that floor ratings are not manually set above floor
  if (
    oldRatings.rating === FLOOR_RATING &&
    newRatings.rating > FLOOR_RATING &&
    newRatings.gamesPlayed < PROVISIONAL_GAMES_REQUIRED
  ) {
    errors.push(
      'Cannot assign rating above floor without completing 30 games in Classical format'
    );
  }

  if (
    oldRatings.rapidRating === FLOOR_RATING &&
    newRatings.rapidRating > FLOOR_RATING &&
    newRatings.rapidGamesPlayed < PROVISIONAL_GAMES_REQUIRED
  ) {
    errors.push(
      'Cannot assign rating above floor without completing 30 games in Rapid format'
    );
  }

  if (
    oldRatings.blitzRating === FLOOR_RATING &&
    newRatings.blitzRating > FLOOR_RATING &&
    newRatings.blitzGamesPlayed < PROVISIONAL_GAMES_REQUIRED
  ) {
    errors.push(
      'Cannot assign rating above floor without completing 30 games in Blitz format'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Example usage scenarios for documentation
 */
export const RATING_EXAMPLES = {
  newPlayer: {
    description: 'New player with no ratings (800 or below)',
    before: {
      rating: 800,
      rapidRating: 800,
      blitzRating: 800,
      gamesPlayed: 0,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
    },
    after: {
      rating: 800,
      rapidRating: 800,
      blitzRating: 800,
      gamesPlayed: 0,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
    },
    bonus:
      'No bonus applied - all formats remain at floor rating (800 or below = no established rating)',
  },
  classicalOnly: {
    description: 'Player with only Classical rating established (801+)',
    before: {
      rating: 2100,
      rapidRating: 800,
      blitzRating: 800,
      gamesPlayed: 30,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
    },
    after: {
      rating: 2200,
      rapidRating: 800,
      blitzRating: 800,
      gamesPlayed: 30,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
    },
    bonus:
      '+100 bonus applied only to Classical (2100 → 2200). Rapid/Blitz stay at 800 (no established rating)',
  },
  mixedRatings: {
    description:
      'Player with mixed ratings - some established (801+), some not (800 or below)',
    before: {
      rating: 2200,
      rapidRating: 1900,
      blitzRating: 801,
      gamesPlayed: 30,
      rapidGamesPlayed: 30,
      blitzGamesPlayed: 30,
    },
    after: {
      rating: 2300,
      rapidRating: 2000,
      blitzRating: 901,
      gamesPlayed: 30,
      rapidGamesPlayed: 30,
      blitzGamesPlayed: 30,
    },
    bonus: '+100 bonus applied to all formats (all are 801+)',
  },
  edgeCase: {
    description: 'Player with rating exactly at 801 (minimum for bonus)',
    before: {
      rating: 801,
      rapidRating: 800,
      blitzRating: 799,
      gamesPlayed: 30,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
    },
    after: {
      rating: 901,
      rapidRating: 800,
      blitzRating: 800,
      gamesPlayed: 30,
      rapidGamesPlayed: 0,
      blitzGamesPlayed: 0,
    },
    bonus:
      '+100 bonus applied only to Classical (801 qualifies). Rapid (800) and Blitz (799) get no bonus',
  },
};
