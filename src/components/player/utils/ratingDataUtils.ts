
import { Player, TournamentResult } from "@/lib/mockData";
import { format } from "date-fns";

interface RatingData {
  history: Array<{ date: string; rating: number }>;
  statusLabel: string;
  gameCount: number;
}

interface RatingChange {
  date: string;
  rating: number;
  change: number;
  reason: string;
}

export const prepareRatingHistory = (
  player: Player,
  ratingFormat: "classical" | "rapid" | "blitz"
): RatingData => {
  let history: Array<{ date: string; rating: number }> = [];
  let statusLabel = "Provisional";
  let gameCount = 0;
  
  if (ratingFormat === "classical" && player.ratingHistory) {
    history = player.ratingHistory.map(entry => ({
      date: format(new Date(entry.date), "MMM yyyy"),
      rating: entry.rating
    }));
    statusLabel = player.ratingStatus || "Provisional";
    gameCount = player.gamesPlayed || 0;
  } else if (ratingFormat === "rapid" && player.rapidRatingHistory) {
    history = player.rapidRatingHistory.map(entry => ({
      date: format(new Date(entry.date), "MMM yyyy"),
      rating: entry.rating
    }));
    statusLabel = player.rapidRatingStatus || "Provisional";
    gameCount = player.rapidGamesPlayed || 0;
  } else if (ratingFormat === "blitz" && player.blitzRatingHistory) {
    history = player.blitzRatingHistory.map(entry => ({
      date: format(new Date(entry.date), "MMM yyyy"),
      rating: entry.rating
    }));
    statusLabel = player.blitzRatingStatus || "Provisional";
    gameCount = player.blitzGamesPlayed || 0;
  }
  
  return { history, statusLabel, gameCount };
};

export const calculateRatingChanges = (
  player: Player,
  ratingFormat: "classical" | "rapid" | "blitz"
): RatingChange[] => {
  let history: any[] = [];
  
  if (ratingFormat === "classical" && player.ratingHistory) {
    history = player.ratingHistory;
  } else if (ratingFormat === "rapid" && player.rapidRatingHistory) {
    history = player.rapidRatingHistory;
  } else if (ratingFormat === "blitz" && player.blitzRatingHistory) {
    history = player.blitzRatingHistory;
  }
  
  if (history.length <= 1) {
    return history.map(entry => ({
      date: entry.date,
      rating: entry.rating,
      change: 0,
      reason: entry.reason || "Initial rating"
    }));
  }
  
  return history.map((entry, index) => {
    let change = 0;
    if (index > 0) {
      change = entry.rating - history[index - 1].rating;
    }
    
    return {
      date: entry.date,
      rating: entry.rating,
      change,
      reason: entry.reason || "-"
    };
  });
};

export const getCurrentRating = (
  player: Player,
  ratingFormat: "classical" | "rapid" | "blitz"
): number => {
  if (ratingFormat === "rapid") return player.rapidRating || 0;
  if (ratingFormat === "blitz") return player.blitzRating || 0;
  return player.rating || 0;
};

export const getTournamentResults = (
  player: Player,
  ratingFormat: "classical" | "rapid" | "blitz"
): TournamentResult[] => {
  if (!player.tournamentResults) return [];
  
  return player.tournamentResults.filter(result => {
    if (ratingFormat === "rapid") return result.format === "rapid";
    if (ratingFormat === "blitz") return result.format === "blitz";
    return result.format === "classical" || !result.format;
  });
};
