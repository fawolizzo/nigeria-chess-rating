import { Player } from "./mockData";

interface PairingMatch {
  whiteId: string;
  blackId: string;
  result?: "1-0" | "0-1" | "1/2-1/2" | "*";
}

interface PlayerWithScore {
  id: string;
  score: number;
  rating: number;
  colorHistory: string[];
  colorBalance: number; // positive = white bias, negative = black bias
  opponentIds: string[];
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

export function generateSwissPairings(
  players: Player[],
  previousRounds: Array<{ 
    roundNumber: number; 
    matches: PairingMatch[] 
  }> = [],
  currentRound: number = 1
): PairingMatch[] {
  console.log(`Generating pairings for round ${currentRound} with ${players.length} players`);
  console.log(`Previous rounds: ${previousRounds.length}`);

  if (players.length < 2) {
    return [];
  }

  const playerData: Record<string, PlayerWithScore> = {};
  
  players.forEach(player => {
    playerData[player.id] = {
      id: player.id,
      score: 0,
      rating: player.rating,
      colorHistory: [],
      colorBalance: 0,
      opponentIds: []
    };
    console.log(`Player ${player.name} (${player.id}) initialized`);
  });

  previousRounds.forEach(round => {
    round.matches.forEach(match => {
      if (!playerData[match.whiteId] || !playerData[match.blackId]) {
        console.warn(`Match with invalid player IDs: ${match.whiteId} vs ${match.blackId}`);
        return;
      }

      playerData[match.whiteId].opponentIds.push(match.blackId);
      playerData[match.blackId].opponentIds.push(match.whiteId);

      playerData[match.whiteId].colorHistory.push("W");
      playerData[match.blackId].colorHistory.push("B");

      playerData[match.whiteId].colorBalance += 1;
      playerData[match.blackId].colorBalance -= 1;

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

  Object.values(playerData).forEach(player => {
    console.log(`Player ${players.find(p => p.id === player.id)?.name} (${player.id}) has played against: ${player.opponentIds.join(', ')}`);
  });

  const scoreGroups: Record<string, string[]> = {};
  
  Object.values(playerData).forEach(player => {
    const score = player.score.toString();
    if (!scoreGroups[score]) {
      scoreGroups[score] = [];
    }
    scoreGroups[score].push(player.id);
  });

  const sortedScores = Object.keys(scoreGroups)
    .map(score => parseFloat(score))
    .sort((a, b) => b - a);

  const pairings: PairingMatch[] = [];
  const pairedPlayers = new Set<string>();

  sortedScores.forEach(score => {
    const playersInGroup = scoreGroups[score.toString()];
    console.log(`Processing score group ${score} with ${playersInGroup.length} players`);
    
    playersInGroup.sort((a, b) => playerData[b].rating - playerData[a].rating);
    
    for (let i = 0; i < playersInGroup.length; i++) {
      const playerId = playersInGroup[i];
      
      if (pairedPlayers.has(playerId)) continue;
      
      let foundOpponent = false;
      
      for (let j = i + 1; j < playersInGroup.length; j++) {
        const opponentId = playersInGroup[j];
        
        if (pairedPlayers.has(opponentId)) continue;
        
        if (playerData[playerId].opponentIds.includes(opponentId)) {
          console.log(`Skipping pairing: ${players.find(p => p.id === playerId)?.name} vs ${players.find(p => p.id === opponentId)?.name} - already played`);
          continue;
        }
        
        foundOpponent = true;
        pairedPlayers.add(playerId);
        pairedPlayers.add(opponentId);
        
        const player1ColorBalance = playerData[playerId].colorBalance;
        const player2ColorBalance = playerData[opponentId].colorBalance;
        
        let whiteId: string, blackId: string;
        
        if (player1ColorBalance < player2ColorBalance) {
          whiteId = playerId;
          blackId = opponentId;
        } else if (player2ColorBalance < player1ColorBalance) {
          whiteId = opponentId;
          blackId = playerId;
        } else {
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
        break;
      }
      
      if (!foundOpponent) {
        console.log(`Couldn't find a valid opponent for ${players.find(p => p.id === playerId)?.name} in the same score group`);
      }
    }
  });

  const unpairedPlayers = players
    .filter(player => !pairedPlayers.has(player.id))
    .sort((a, b) => {
      const scoreA = playerData[a.id].score;
      const scoreB = playerData[b.id].score;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.rating - a.rating;
    })
    .map(player => player.id);

  console.log(`Unpaired players: ${unpairedPlayers.length}`);

  while (unpairedPlayers.length >= 2) {
    const playerId = unpairedPlayers.shift()!;
    let bestOpponentIndex = -1;
    let minPenalty = Infinity;
    
    for (let i = 0; i < unpairedPlayers.length; i++) {
      const opponentId = unpairedPlayers[i];
      
      let penalty = 0;
      
      if (playerData[playerId].opponentIds.includes(opponentId)) {
        penalty += 1000;
      }
      
      const scoreDiff = Math.abs(playerData[playerId].score - playerData[opponentId].score);
      penalty += scoreDiff * 100;
      
      const ratingDiff = Math.abs(playerData[playerId].rating - playerData[opponentId].rating) / 100;
      penalty += ratingDiff;
      
      if (penalty < minPenalty) {
        minPenalty = penalty;
        bestOpponentIndex = i;
      }
    }
    
    if (bestOpponentIndex >= 0) {
      const opponentId = unpairedPlayers.splice(bestOpponentIndex, 1)[0];
      
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
      
      if (playerData[playerId].opponentIds.includes(opponentId)) {
        console.log(`WARN: Forced to pair ${players.find(p => p.id === playerId)?.name} with a previous opponent`);
      }
      
      console.log(`Pairing (cross-score): ${players.find(p => p.id === whiteId)?.name} (White) vs ${players.find(p => p.id === blackId)?.name} (Black)`);
      pairings.push({ whiteId, blackId });
    }
  }

  if (unpairedPlayers.length === 1) {
    const byePlayerId = unpairedPlayers[0];
    console.log(`Player ${players.find(p => p.id === byePlayerId)?.name} gets a bye`);
  }

  console.log(`Generated ${pairings.length} pairings for round ${currentRound}`);
  return pairings;
}

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
  
  players.forEach(player => {
    standings[player.id] = {
      playerId: player.id,
      playerName: player.name,
      rating: player.rating,
      score: 0,
      games: 0
    };
  });
  
  pairings.forEach(round => {
    round.matches.forEach(match => {
      if (match.result === "*") return;
      
      if (match.result === "1-0") {
        standings[match.whiteId].score += 1;
      } else if (match.result === "0-1") {
        standings[match.blackId].score += 1;
      } else if (match.result === "1/2-1/2") {
        standings[match.whiteId].score += 0.5;
        standings[match.blackId].score += 0.5;
      }
      
      standings[match.whiteId].games += 1;
      standings[match.blackId].games += 1;
    });
  });
  
  return Object.values(standings).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.rating - a.rating;
  });
}

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
