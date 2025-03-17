
// Implementation of a Swiss pairing system inspired by Lichess algorithms
// This service avoids repeat pairings and properly handles color allocation

import { Player } from "./mockData";

interface PlayerWithScore {
  player: Player;
  score: number;
  colorBalance: number; // positive = more whites, negative = more blacks
  previousOpponents: string[];
  hasForfeited?: boolean;
}

type MatchResult = "1-0" | "0-1" | "1/2-1/2" | "*";

interface Match {
  whiteId: string;
  blackId: string;
  result?: MatchResult;
}

interface Round {
  roundNumber: number;
  matches: Match[];
}

/**
 * Generate pairings for a Swiss tournament round
 */
export const generateSwissPairings = (
  players: Player[],
  previousRounds: Round[] = [],
  currentRound: number
): Match[] => {
  // If we don't have enough players, return empty array
  if (players.length < 2) {
    return [];
  }

  console.log(`Generating pairings for round ${currentRound} with ${players.length} players`);
  console.log(`Previous rounds: ${previousRounds.length}`);

  // 1. Create player structures with scores and previous opponent data
  const playerData: Record<string, PlayerWithScore> = {};
  
  // Initialize player data
  players.forEach((player) => {
    playerData[player.id] = {
      player,
      score: 0,
      colorBalance: 0, // 0 = equal white/black, positive = more whites
      previousOpponents: [],
    };
  });

  // Calculate scores and collect data from previous rounds
  previousRounds.forEach((round) => {
    round.matches.forEach((match) => {
      // Track previous opponents
      if (playerData[match.whiteId]) {
        playerData[match.whiteId].previousOpponents.push(match.blackId);
        playerData[match.whiteId].colorBalance += 1; // Played as white
      }
      
      if (playerData[match.blackId]) {
        playerData[match.blackId].previousOpponents.push(match.whiteId);
        playerData[match.blackId].colorBalance -= 1; // Played as black
      }
      
      // Calculate scores
      if (match.result === "1-0") {
        playerData[match.whiteId].score += 1;
      } else if (match.result === "0-1") {
        playerData[match.blackId].score += 1;
      } else if (match.result === "1/2-1/2") {
        playerData[match.whiteId].score += 0.5;
        playerData[match.blackId].score += 0.5;
      }
    });
  });

  // Log opponent info for debugging
  Object.entries(playerData).forEach(([id, data]) => {
    console.log(`Player ${data.player.name} (${id}) has played against: ${data.previousOpponents.join(", ")}`);
  });

  // 2. Sort players into score groups
  const scoreGroups: Record<string, PlayerWithScore[]> = {};
  
  Object.values(playerData).forEach((player) => {
    const scoreKey = player.score.toString();
    if (!scoreGroups[scoreKey]) {
      scoreGroups[scoreKey] = [];
    }
    scoreGroups[scoreKey].push(player);
  });

  // 3. Sort score groups from highest to lowest
  const sortedScoreKeys = Object.keys(scoreGroups)
    .map(Number)
    .sort((a, b) => b - a);

  // 4. Assign pairings starting from the highest score group
  const pairings: Match[] = [];
  const paired: Set<string> = new Set();

  // Process each score group in order
  for (const scoreKey of sortedScoreKeys) {
    let playersInGroup = scoreGroups[scoreKey];
    console.log(`Processing score group ${scoreKey} with ${playersInGroup.length} players`);
    
    // Sort players by rating within score group (descending)
    playersInGroup.sort((a, b) => b.player.rating - a.player.rating);
    
    // Try to find pairings within the score group
    while (playersInGroup.length >= 2) {
      const player1 = playersInGroup[0];
      if (paired.has(player1.player.id)) {
        playersInGroup = playersInGroup.slice(1);
        continue;
      }
      
      // Find best opponent for player1
      let bestOpponentIdx = -1;
      let bestOpponentScore = -Infinity;
      
      // Prioritize: 1. No rematches 2. Best color balance 3. Closest rating
      for (let i = 1; i < playersInGroup.length; i++) {
        const player2 = playersInGroup[i];
        if (paired.has(player2.player.id)) continue;
        
        // Check if they've played before - critical to avoid rematches
        const hasPlayed = player1.previousOpponents.includes(player2.player.id);
        
        if (hasPlayed) {
          // Skip this opponent if they've played before
          console.log(`Skipping pairing: ${player1.player.name} vs ${player2.player.name} - already played`);
          continue;
        }
        
        // Calculate pairing score based on color balance and rating difference
        // Negative score means worse pairing
        let pairingScore = 0;
        
        // Color balance is important - players shouldn't have too many whites or blacks
        const colorBalanceScore = -Math.abs(player1.colorBalance + player2.colorBalance);
        pairingScore += colorBalanceScore * 10; // Weigh color balance heavily
        
        // Rating difference - try to pair players with similar ratings
        const ratingDiffScore = -Math.abs(player1.player.rating - player2.player.rating) / 100;
        pairingScore += ratingDiffScore;
        
        if (pairingScore > bestOpponentScore) {
          bestOpponentScore = pairingScore;
          bestOpponentIdx = i;
        }
      }
      
      // If we found a valid opponent
      if (bestOpponentIdx !== -1) {
        const player2 = playersInGroup[bestOpponentIdx];
        
        // Determine colors based on color balance
        const colorBalance1 = player1.colorBalance;
        const colorBalance2 = player2.colorBalance;
        
        let whiteId, blackId;
        
        // Player with more blacks (negative balance) should get white
        if (colorBalance1 < colorBalance2) {
          whiteId = player1.player.id;
          blackId = player2.player.id;
        } else if (colorBalance2 < colorBalance1) {
          whiteId = player2.player.id;
          blackId = player1.player.id;
        } else {
          // If color balance is equal, assign randomly
          if (Math.random() > 0.5) {
            whiteId = player1.player.id;
            blackId = player2.player.id;
          } else {
            whiteId = player2.player.id;
            blackId = player1.player.id;
          }
        }
        
        console.log(`Pairing: ${playerData[whiteId].player.name} (White) vs ${playerData[blackId].player.name} (Black)`);
        
        pairings.push({ whiteId, blackId, result: "*" });
        paired.add(player1.player.id);
        paired.add(player2.player.id);
        
        // Remove paired players from the pool
        playersInGroup = playersInGroup.filter(
          p => p.player.id !== player1.player.id && p.player.id !== player2.player.id
        );
      } else {
        // If we couldn't find a valid opponent within the score group,
        // move this player to the next score group
        console.log(`Couldn't find a valid opponent for ${player1.player.name} in the same score group`);
        
        // Move to the next player
        playersInGroup = playersInGroup.slice(1);
      }
    }
  }
  
  // Handle remaining unpaired players (cross-score pairings)
  const unpairedIds = players
    .filter(p => !paired.has(p.id))
    .map(p => p.id);
  
  console.log(`Unpaired players: ${unpairedIds.length}`);
  
  if (unpairedIds.length >= 2) {
    // Create a simplified approach for remaining players
    const unpairedData = unpairedIds.map(id => playerData[id]).sort((a, b) => {
      // Sort by score (descending)
      if (b.score !== a.score) return b.score - a.score;
      // Then by rating (descending)
      return b.player.rating - a.player.rating;
    });
    
    while (unpairedData.length >= 2) {
      const player1 = unpairedData[0];
      
      // Find an opponent that hasn't played against player1 yet
      let opponentIdx = -1;
      for (let i = 1; i < unpairedData.length; i++) {
        if (!player1.previousOpponents.includes(unpairedData[i].player.id)) {
          opponentIdx = i;
          break;
        }
      }
      
      // If no valid opponent found, take the next best option
      if (opponentIdx === -1) {
        opponentIdx = 1;
        console.log(`WARN: Forced to pair ${player1.player.name} with a previous opponent`);
      }
      
      const player2 = unpairedData[opponentIdx];
      
      // Determine colors
      let whiteId, blackId;
      if (player1.colorBalance < player2.colorBalance) {
        whiteId = player1.player.id;
        blackId = player2.player.id;
      } else {
        whiteId = player2.player.id;
        blackId = player1.player.id;
      }
      
      pairings.push({ whiteId, blackId, result: "*" });
      console.log(`Pairing (cross-score): ${playerData[whiteId].player.name} (White) vs ${playerData[blackId].player.name} (Black)`);
      
      // Remove paired players
      unpairedData.splice(opponentIdx, 1);
      unpairedData.splice(0, 1);
    }
  }
  
  // Handle byes if there's an odd number of players
  if (unpairedIds.length % 2 !== 0 && unpairedIds.length > 0) {
    const byePlayerId = unpairedIds[0];
    console.log(`Player ${playerData[byePlayerId].player.name} gets a bye for round ${currentRound}`);
    // In a real implementation, you would record the bye and award points
  }
  
  console.log(`Generated ${pairings.length} pairings for round ${currentRound}`);
  return pairings;
};

/**
 * Initialize standings based on player ratings
 * Used when showing initial standings before first round
 */
export const initializeStandingsByRating = (players: Player[]) => {
  return [...players].sort((a, b) => b.rating - a.rating);
};

/**
 * Check if a player has played against another in previous rounds
 */
export const hasPlayedBefore = (
  player1Id: string,
  player2Id: string,
  previousRounds: Round[]
): boolean => {
  return previousRounds.some(round => 
    round.matches.some(match => 
      (match.whiteId === player1Id && match.blackId === player2Id) ||
      (match.whiteId === player2Id && match.blackId === player1Id)
    )
  );
};
