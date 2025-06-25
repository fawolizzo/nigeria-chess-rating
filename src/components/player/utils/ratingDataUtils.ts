import { Player, RatingHistoryEntry, TournamentResult } from "@/lib/mockData";

export const prepareRatingHistory = (
  player: Player,
  format: "classical" | "rapid" | "blitz"
) => {
  let history: RatingHistoryEntry[] = [];
  let statusLabel = "provisional";
  let gameCount = 0;
  
  switch (format) {
    case "classical":
      history = player.ratingHistory || [];
      gameCount = player.gamesPlayed || 0;
      statusLabel = player.ratingStatus || (gameCount >= 30 ? "established" : "provisional");
      break;
    case "rapid":
      history = player.rapidRatingHistory || [];
      gameCount = player.rapidGamesPlayed || 0;
      statusLabel = player.rapidRatingStatus || (gameCount >= 30 ? "established" : "provisional");
      break;
    case "blitz":
      history = player.blitzRatingHistory || [];
      gameCount = player.blitzGamesPlayed || 0;
      statusLabel = player.blitzRatingStatus || (gameCount >= 30 ? "established" : "provisional");
      break;
  }
  
  return { history, statusLabel, gameCount };
};

export const calculateRatingChanges = (
  player: Player,
  format: "classical" | "rapid" | "blitz"
) => {
  const { history } = prepareRatingHistory(player, format);
  
  const changes = [];
  if (history.length > 0) {
    for (let i = 0; i < history.length; i++) {
      const entry = history[i];
      let change = 0;
      
      if (i > 0) {
        change = entry.rating - history[i-1].rating;
      }
      
      changes.push({
        date: entry.date,
        rating: entry.rating,
        change,
        reason: entry.reason || "-"
      });
    }
  }
  
  return changes;
};

export const getCurrentRating = (
  player: Player,
  format: "classical" | "rapid" | "blitz"
) => {
  switch (format) {
    case "classical":
      return player.rating || 0;
    case "rapid":
      return player.rapidRating || 0;
    case "blitz":
      return player.blitzRating || 0;
    default:
      return player.rating || 0;
  }
};

export const getTournamentResults = (
  player: Player,
  format: "classical" | "rapid" | "blitz"
) => {
  const results = player.tournamentResults || [];
  return Array.isArray(results)
    ? results.filter(result => {
        if (format === "rapid") return result.format === "rapid";
        if (format === "blitz") return result.format === "blitz";
        return result.format === "classical" || !result.format;
      })
    : [];
};
