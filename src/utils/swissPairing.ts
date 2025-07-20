/**
 * Swiss Pairing System Implementation
 * Based on FIDE Swiss System Rules
 */

export interface Player {
  id: string;
  name: string;
  rating: number;
  points: number;
  opponents: string[];
  colors: ('white' | 'black')[];
  byeReceived: boolean;
}

export interface Pairing {
  id: string;
  round: number;
  whitePlayer: Player;
  blackPlayer: Player | null; // null for bye
  result?: '1-0' | '0-1' | '1/2-1/2' | '1F-0' | '0-1F' | '0F-0F';
  isBye: boolean;
}

export interface SwissPairingOptions {
  avoidRepeatPairings: boolean;
  alternateColors: boolean;
  byeValue: number; // 0.5 for draw, 1 for win
}

/**
 * Generate Swiss pairings for a round
 */
export function generateSwissPairings(
  players: Player[],
  round: number,
  options: SwissPairingOptions = {
    avoidRepeatPairings: true,
    alternateColors: true,
    byeValue: 1,
  }
): Pairing[] {
  const pairings: Pairing[] = [];
  const availablePlayers = [...players];

  // Sort players by points (descending), then by rating (descending)
  availablePlayers.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return b.rating - a.rating;
  });

  console.log(
    `🏆 Generating Round ${round} pairings for ${availablePlayers.length} players`
  );

  if (round === 1) {
    return generateFirstRoundPairings(availablePlayers);
  }

  return generateSubsequentRoundPairings(availablePlayers, round, options);
}

/**
 * Generate first round pairings (random with rating adjustments)
 */
function generateFirstRoundPairings(players: Player[]): Pairing[] {
  const pairings: Pairing[] = [];
  const shuffledPlayers = [...players];

  // Sort by rating for initial seeding, then add some randomization
  shuffledPlayers.sort((a, b) => b.rating - a.rating);

  // Pair top half with bottom half
  const topHalf = shuffledPlayers.slice(
    0,
    Math.floor(shuffledPlayers.length / 2)
  );
  const bottomHalf = shuffledPlayers.slice(
    Math.floor(shuffledPlayers.length / 2)
  );

  for (let i = 0; i < topHalf.length && i < bottomHalf.length; i++) {
    const whitePlayer = Math.random() > 0.5 ? topHalf[i] : bottomHalf[i];
    const blackPlayer = whitePlayer === topHalf[i] ? bottomHalf[i] : topHalf[i];

    pairings.push({
      id: `r1-p${i + 1}`,
      round: 1,
      whitePlayer,
      blackPlayer,
      isBye: false,
    });
  }

  // Handle bye if odd number of players
  if (shuffledPlayers.length % 2 === 1) {
    const byePlayer = shuffledPlayers[shuffledPlayers.length - 1];
    pairings.push({
      id: `r1-bye`,
      round: 1,
      whitePlayer: byePlayer,
      blackPlayer: null,
      isBye: true,
    });
  }

  return pairings;
}

/**
 * Generate pairings for subsequent rounds
 */
function generateSubsequentRoundPairings(
  players: Player[],
  round: number,
  options: SwissPairingOptions
): Pairing[] {
  const pairings: Pairing[] = [];
  const availablePlayers = [...players];

  // Group players by points
  const pointGroups = groupPlayersByPoints(availablePlayers);

  console.log(
    `📊 Point groups for round ${round}:`,
    Object.keys(pointGroups).map(
      (points) =>
        `${points} pts: ${pointGroups[parseFloat(points)].length} players`
    )
  );

  let pairingId = 1;

  // Process each point group
  for (const pointsStr of Object.keys(pointGroups).sort(
    (a, b) => parseFloat(b) - parseFloat(a)
  )) {
    const points = parseFloat(pointsStr);
    const group = pointGroups[points];

    if (group.length === 0) continue;

    // Try to pair within the group first
    const groupPairings = pairWithinGroup(group, round, options, pairingId);
    pairings.push(...groupPairings);
    pairingId += groupPairings.length;

    // Remove paired players from available list
    groupPairings.forEach((pairing) => {
      const whiteIndex = availablePlayers.findIndex(
        (p) => p.id === pairing.whitePlayer.id
      );
      if (whiteIndex !== -1) availablePlayers.splice(whiteIndex, 1);

      if (pairing.blackPlayer) {
        const blackIndex = availablePlayers.findIndex(
          (p) => p.id === pairing.blackPlayer!.id
        );
        if (blackIndex !== -1) availablePlayers.splice(blackIndex, 1);
      }
    });
  }

  // Handle remaining unpaired players (cross-group pairings)
  while (availablePlayers.length >= 2) {
    const player1 = availablePlayers.shift()!;
    const player2 = findBestOpponent(player1, availablePlayers, options);

    if (player2) {
      const playerIndex = availablePlayers.findIndex(
        (p) => p.id === player2.id
      );
      availablePlayers.splice(playerIndex, 1);

      const { whitePlayer, blackPlayer } = determineColors(
        player1,
        player2,
        options
      );

      pairings.push({
        id: `r${round}-p${pairingId}`,
        round,
        whitePlayer,
        blackPlayer,
        isBye: false,
      });
      pairingId++;
    }
  }

  // Handle bye for remaining player
  if (availablePlayers.length === 1) {
    const byePlayer = availablePlayers[0];

    // Check if player already received a bye
    if (byePlayer.byeReceived) {
      console.warn(
        `⚠️ Player ${byePlayer.name} receiving second bye - not ideal`
      );
    }

    pairings.push({
      id: `r${round}-bye`,
      round,
      whitePlayer: byePlayer,
      blackPlayer: null,
      isBye: true,
    });
  }

  return pairings;
}

/**
 * Group players by their current points
 */
function groupPlayersByPoints(players: Player[]): Record<number, Player[]> {
  const groups: Record<number, Player[]> = {};

  players.forEach((player) => {
    if (!groups[player.points]) {
      groups[player.points] = [];
    }
    groups[player.points].push(player);
  });

  return groups;
}

/**
 * Pair players within the same point group
 */
function pairWithinGroup(
  players: Player[],
  round: number,
  options: SwissPairingOptions,
  startingPairingId: number
): Pairing[] {
  const pairings: Pairing[] = [];
  const availablePlayers = [...players];
  let pairingId = startingPairingId;

  // Sort by rating within the group
  availablePlayers.sort((a, b) => b.rating - a.rating);

  while (availablePlayers.length >= 2) {
    const player1 = availablePlayers.shift()!;
    const opponent = findBestOpponent(player1, availablePlayers, options);

    if (opponent) {
      const opponentIndex = availablePlayers.findIndex(
        (p) => p.id === opponent.id
      );
      availablePlayers.splice(opponentIndex, 1);

      const { whitePlayer, blackPlayer } = determineColors(
        player1,
        opponent,
        options
      );

      pairings.push({
        id: `r${round}-p${pairingId}`,
        round,
        whitePlayer,
        blackPlayer,
        isBye: false,
      });
      pairingId++;
    } else {
      // No suitable opponent found, leave for cross-group pairing
      break;
    }
  }

  return pairings;
}

/**
 * Find the best opponent for a player
 */
function findBestOpponent(
  player: Player,
  candidates: Player[],
  options: SwissPairingOptions
): Player | null {
  if (candidates.length === 0) return null;

  // Filter out players already played against
  let availableCandidates = candidates;
  if (options.avoidRepeatPairings) {
    availableCandidates = candidates.filter(
      (candidate) => !player.opponents.includes(candidate.id)
    );
  }

  // If no new opponents available, use all candidates
  if (availableCandidates.length === 0) {
    availableCandidates = candidates;
    console.warn(
      `⚠️ No new opponents for ${player.name}, allowing repeat pairing`
    );
  }

  // Sort by rating proximity (prefer similar ratings)
  availableCandidates.sort((a, b) => {
    const ratingDiffA = Math.abs(player.rating - a.rating);
    const ratingDiffB = Math.abs(player.rating - b.rating);
    return ratingDiffA - ratingDiffB;
  });

  return availableCandidates[0];
}

/**
 * Determine which player gets white and black pieces
 */
function determineColors(
  player1: Player,
  player2: Player,
  options: SwissPairingOptions
): { whitePlayer: Player; blackPlayer: Player } {
  if (!options.alternateColors) {
    // Random color assignment
    return Math.random() > 0.5
      ? { whitePlayer: player1, blackPlayer: player2 }
      : { whitePlayer: player2, blackPlayer: player1 };
  }

  // Calculate color balance for each player
  const player1WhiteCount = player1.colors.filter((c) => c === 'white').length;
  const player1BlackCount = player1.colors.filter((c) => c === 'black').length;
  const player2WhiteCount = player2.colors.filter((c) => c === 'white').length;
  const player2BlackCount = player2.colors.filter((c) => c === 'black').length;

  const player1Balance = player1WhiteCount - player1BlackCount;
  const player2Balance = player2WhiteCount - player2BlackCount;

  // Player with more negative balance (more blacks) gets white
  if (player1Balance < player2Balance) {
    return { whitePlayer: player1, blackPlayer: player2 };
  } else if (player2Balance < player1Balance) {
    return { whitePlayer: player2, blackPlayer: player1 };
  } else {
    // Equal balance, prefer higher rated player gets white
    return player1.rating >= player2.rating
      ? { whitePlayer: player1, blackPlayer: player2 }
      : { whitePlayer: player2, blackPlayer: player1 };
  }
}

/**
 * Calculate tournament standings with tiebreaks
 */
export function calculateStandings(
  players: Player[],
  pairings: Pairing[]
): Player[] {
  const standings = [...players];

  // Calculate additional tiebreak scores
  standings.forEach((player) => {
    // Buchholz score (sum of opponents' scores)
    let buchholzScore = 0;
    player.opponents.forEach((opponentId) => {
      const opponent = players.find((p) => p.id === opponentId);
      if (opponent) {
        buchholzScore += opponent.points;
      }
    });

    // Sonneborn-Berger score (sum of defeated opponents' scores + half of drawn opponents' scores)
    let sonnebornBergerScore = 0;
    // This would require match results to calculate properly

    (player as any).buchholzScore = buchholzScore;
    (player as any).sonnebornBergerScore = sonnebornBergerScore;
  });

  // Sort by points, then by tiebreaks
  standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }

    // Tiebreak 1: Direct encounter
    if (a.opponents.includes(b.id)) {
      // Would need to check actual result between these players
    }

    // Tiebreak 2: Buchholz score
    const aBuchholz = (a as any).buchholzScore || 0;
    const bBuchholz = (b as any).buchholzScore || 0;
    if (bBuchholz !== aBuchholz) {
      return bBuchholz - aBuchholz;
    }

    // Tiebreak 3: Rating
    return b.rating - a.rating;
  });

  return standings;
}

/**
 * Validate pairing legality
 */
export function validatePairings(pairings: Pairing[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const playerIds = new Set<string>();

  pairings.forEach((pairing, index) => {
    // Check for duplicate players
    if (playerIds.has(pairing.whitePlayer.id)) {
      errors.push(
        `Player ${pairing.whitePlayer.name} appears in multiple pairings`
      );
    }
    playerIds.add(pairing.whitePlayer.id);

    if (pairing.blackPlayer && playerIds.has(pairing.blackPlayer.id)) {
      errors.push(
        `Player ${pairing.blackPlayer.name} appears in multiple pairings`
      );
    }
    if (pairing.blackPlayer) {
      playerIds.add(pairing.blackPlayer.id);
    }

    // Check for self-pairing
    if (
      pairing.blackPlayer &&
      pairing.whitePlayer.id === pairing.blackPlayer.id
    ) {
      errors.push(`Player ${pairing.whitePlayer.name} paired with themselves`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
