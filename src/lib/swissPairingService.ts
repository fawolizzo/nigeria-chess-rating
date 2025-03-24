
import { Player } from "./mockData";

interface PairingMatch {
  whiteId: string;
  blackId: string;
  result?: "1-0" | "0-1" | "1/2-1/2" | "*";
  whiteRatingChange?: number;
  blackRatingChange?: number;
}

interface PlayerWithScore {
  id: string;
  score: number;
  rating: number;
  colorHistory: string[];
  colorBalance: number; // positive = white bias, negative = black bias
  opponentIds: string[];
  receivedBye?: boolean;
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  points: number;
  rating: number;
  opponents: string[];
  colorHistory: string[];
  tieBreak1: number; // Buchholz
  tieBreak2: number; // Sonneborn-Berger
  rank: number;
  score?: number;
  tiebreak?: number[];
}

/**
 * Generates Swiss pairings for a chess tournament round
 * 
 * @param players List of players in the tournament
 * @param previousRounds Previous round data
 * @param currentRound Current round number
 * @returns Array of matches with white and black player IDs
 */
export function generateSwissPairings(
  players: Player[],
  previousRounds: Array<{ 
    roundNumber: number; 
    matches: PairingMatch[] 
  }> = [],
  currentRound: number = 1
): PairingMatch[] {
  console.log(`Generating pairings for round ${currentRound} with ${players.length} players`);
  
  // Only pair approved players
  const approvedPlayers = players.filter(p => p.status === 'approved');
  
  if (approvedPlayers.length < 2) {
    console.log("Not enough players to generate pairings");
    return [];
  }

  // Initialize player data with history from previous rounds
  const playerData: Record<string, PlayerWithScore> = {};
  
  // Sort players by rating in descending order before initializing player data
  // This ensures the highest rated player will be at the top of each score group
  const sortedPlayers = [...approvedPlayers].sort((a, b) => b.rating - a.rating);
  
  sortedPlayers.forEach(player => {
    playerData[player.id] = {
      id: player.id,
      score: 0,
      rating: player.rating,
      colorHistory: [],
      colorBalance: 0,
      opponentIds: [],
      receivedBye: false
    };
  });

  // Process previous rounds to build player histories
  previousRounds.forEach(round => {
    round.matches.forEach(match => {
      if (!playerData[match.whiteId] || !playerData[match.blackId]) {
        console.warn(`Match with invalid player IDs: ${match.whiteId} vs ${match.blackId}`);
        return;
      }

      // Record opponents
      playerData[match.whiteId].opponentIds.push(match.blackId);
      playerData[match.blackId].opponentIds.push(match.whiteId);

      // Record color history
      playerData[match.whiteId].colorHistory.push("W");
      playerData[match.blackId].colorHistory.push("B");

      // Update color balance
      playerData[match.whiteId].colorBalance += 1;
      playerData[match.blackId].colorBalance -= 1;

      // Update scores based on results
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

  // Check for byes in previous rounds
  previousRounds.forEach(round => {
    const playersInRound = new Set<string>();
    
    round.matches.forEach(match => {
      playersInRound.add(match.whiteId);
      playersInRound.add(match.blackId);
    });
    
    // Players who weren't in any matches received a bye
    approvedPlayers.forEach(player => {
      if (!playersInRound.has(player.id) && playerData[player.id]) {
        playerData[player.id].receivedBye = true;
      }
    });
  });
  
  // Group players by score
  const scoreGroups: Record<string, string[]> = {};
  
  Object.values(playerData).forEach(player => {
    const score = player.score.toString();
    if (!scoreGroups[score]) {
      scoreGroups[score] = [];
    }
    scoreGroups[score].push(player.id);
  });

  // Sort scores descending
  const sortedScores = Object.keys(scoreGroups)
    .map(score => parseFloat(score))
    .sort((a, b) => b - a);

  const pairings: PairingMatch[] = [];
  const pairedPlayers = new Set<string>();
  
  // Main pairing algorithm - starts with highest score group
  sortedScores.forEach(score => {
    const playersInGroup = scoreGroups[score.toString()];
    console.log(`Processing score group ${score} with ${playersInGroup.length} players`);
    
    // Sort each score group by rating to ensure highest rated plays first
    playersInGroup.sort((a, b) => playerData[b].rating - playerData[a].rating);
    
    // Create a copy of players that will be processed in order
    const playersToPair = [...playersInGroup];
    
    while (playersToPair.length >= 2) {
      // Take the highest rated/seeded player who hasn't been paired yet
      const playerId = playersToPair.shift()!;
      
      if (pairedPlayers.has(playerId)) continue;
      
      let bestOpponentIndex = -1;
      let bestPenalty = Infinity;
      
      // Find the best opponent for this player
      for (let j = 0; j < playersToPair.length; j++) {
        const opponentId = playersToPair[j];
        
        if (pairedPlayers.has(opponentId)) continue;
        
        // Skip if players have already played each other or if it's the same player
        if (playerData[playerId].opponentIds.includes(opponentId) || playerId === opponentId) {
          continue;
        }
        
        // Calculate penalty - prefer players closer to the top of the list
        const penalty = j;
        
        if (penalty < bestPenalty) {
          bestPenalty = penalty;
          bestOpponentIndex = j;
        }
      }
      
      if (bestOpponentIndex >= 0) {
        // Remove this opponent from the list
        const opponentId = playersToPair.splice(bestOpponentIndex, 1)[0];
        
        pairedPlayers.add(playerId);
        pairedPlayers.add(opponentId);
        
        // Decide colors based on color balance
        const player1ColorBalance = playerData[playerId].colorBalance;
        const player2ColorBalance = playerData[opponentId].colorBalance;
        
        let whiteId: string, blackId: string;
        
        if (player1ColorBalance < player2ColorBalance) {
          // Player 1 needs white more
          whiteId = playerId;
          blackId = opponentId;
        } else if (player2ColorBalance < player1ColorBalance) {
          // Player 2 needs white more
          whiteId = opponentId;
          blackId = playerId;
        } else {
          // Equal color balance, alternate from previous color
          const player1LastColor = playerData[playerId].colorHistory[playerData[playerId].colorHistory.length - 1];
          if (player1LastColor === "W") {
            whiteId = opponentId;
            blackId = playerId;
          } else {
            whiteId = playerId;
            blackId = opponentId;
          }
        }
        
        pairings.push({ whiteId, blackId });
      } else {
        // Couldn't find a suitable opponent in the same score group
        // Put this player back in the playersToPair list at the front
        playersToPair.unshift(playerId);
        break;
      }
    }
  }

  // Handle unpaired players (they might need to be paired across score groups)
  // Start with the highest-rated unpaired player
  const unpairedPlayers = approvedPlayers
    .filter(player => !pairedPlayers.has(player.id))
    .sort((a, b) => {
      const scoreA = playerData[a.id]?.score || 0;
      const scoreB = playerData[b.id]?.score || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.rating - a.rating;
    })
    .map(player => player.id);

  console.log(`Players still unpaired: ${unpairedPlayers.length}`);

  // Pair remaining players with minimal score difference
  while (unpairedPlayers.length >= 2) {
    const playerId = unpairedPlayers.shift()!;
    let bestOpponentIndex = -1;
    let minPenalty = Infinity;
    
    // Find the best opponent with minimal penalties
    for (let i = 0; i < unpairedPlayers.length; i++) {
      const opponentId = unpairedPlayers[i];
      
      // Never pair a player with themselves
      if (playerId === opponentId) {
        continue;
      }
      
      let penalty = 0;
      
      // Extremely high penalty for pairing players who have already played
      if (playerData[playerId].opponentIds.includes(opponentId)) {
        penalty += 10000; // Make this effectively impossible
      }
      
      // Penalty for score difference
      const scoreDiff = Math.abs(playerData[playerId].score - playerData[opponentId].score);
      penalty += scoreDiff * 100;
      
      // Small penalty for rating difference
      const ratingDiff = Math.abs(playerData[playerId].rating - playerData[opponentId].rating) / 100;
      penalty += ratingDiff;
      
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestOpponentIndex = i;
      }
    }
    
    if (bestOpponentIndex >= 0 && minPenalty < 9999) { // Only pair if previous match penalty not triggered
      const opponentId = unpairedPlayers.splice(bestOpponentIndex, 1)[0];
      
      // Assign colors based on color balance
      const player1ColorBalance = playerData[playerId].colorBalance;
      const player2ColorBalance = playerData[opponentId].colorBalance;
      
      let whiteId: string, blackId: string;
      
      if (player1ColorBalance < player2ColorBalance) {
        whiteId = playerId;
        blackId = opponentId;
      } else {
        whiteId = opponentId;
        blackId = playerId;
      }
      
      console.log(`Pairing (cross-score): ${approvedPlayers.find(p => p.id === whiteId)?.name || whiteId} (W) vs ${approvedPlayers.find(p => p.id === blackId)?.name || blackId} (B)`);
      pairings.push({ whiteId, blackId });
    } else {
      // Couldn't find a good pairing, put this player back
      unpairedPlayers.unshift(playerId);
      break;
    }
  }

  // Handle odd number of players (bye)
  if (unpairedPlayers.length === 1) {
    const byePlayerId = unpairedPlayers[0];
    console.log(`Player ${approvedPlayers.find(p => p.id === byePlayerId)?.name || byePlayerId} gets a bye`);
    // In a real Swiss system, the bye would award a point automatically
    // You would need to handle this in your tournament management logic
  }

  // Sort pairings by player rating to ensure highest rated plays first
  pairings.sort((a, b) => {
    const playerARating = approvedPlayers.find(p => p.id === a.whiteId)?.rating || 0;
    const playerBRating = approvedPlayers.find(p => p.id === b.whiteId)?.rating || 0;
    return playerBRating - playerARating;
  });

  console.log(`Generated ${pairings.length} pairings for round ${currentRound}`);
  return pairings;
}

/**
 * Calculates standings for a tournament
 * 
 * @param players List of players in the tournament
 * @param pairings Completed round data with results
 * @returns Array of player standings
 */
export function calculateStandings(
  players: Player[],
  pairings: Array<{ roundNumber: number; matches: PairingMatch[] }> = []
): Array<{ playerId: string; playerName: string; rating: number; score: number; games: number }> {
  const standings: Record<string, { 
    playerId: string;
    playerName: string;
    rating: number;
    score: number;
    games: number;
  }> = {};
  
  // Initialize standings with all players
  players.forEach(player => {
    standings[player.id] = {
      playerId: player.id,
      playerName: player.name,
      rating: player.rating,
      score: 0,
      games: 0
    };
  });
  
  // Process all completed rounds
  pairings.forEach(round => {
    round.matches.forEach(match => {
      if (match.result === "*") return; // Skip unfinished games
      
      if (match.result === "1-0") {
        standings[match.whiteId].score += 1;
      } else if (match.result === "0-1") {
        standings[match.blackId].score += 1;
      } else if (match.result === "1/2-1/2") {
        standings[match.whiteId].score += 0.5;
        standings[match.blackId].score += 0.5;
      }
      
      // Increment game count
      standings[match.whiteId].games += 1;
      standings[match.blackId].games += 1;
    });
  });
  
  // Sort by score then by rating
  return Object.values(standings).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.rating - a.rating;
  });
}

/**
 * Gets initial standings sorted by rating
 */
export function getInitialStandings(players: Player[]): Array<{
  playerId: string;
  playerName: string;
  rating: number;
  score: number;
  games: number;
}> {
  return players
    .map(player => ({
      playerId: player.id,
      playerName: player.name,
      rating: player.rating,
      score: 0,
      games: 0
    }))
    .sort((a, b) => b.rating - a.rating);
}

/**
 * Initializes player standings based on rating
 */
export const initializeStandingsByRating = (players: Player[]): PlayerStanding[] => {
  return players.map(player => ({
    playerId: player.id,
    playerName: player.name,
    points: 0,
    rating: player.rating || 0,
    opponents: [],
    colorHistory: [],
    tieBreak1: 0,
    tieBreak2: 0,
    rank: 0,
    score: 0,
    tiebreak: [0, 0]
  })).sort((a, b) => b.rating - a.rating);
};
