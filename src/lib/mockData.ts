
export interface RatingHistoryEntry {
  date: string;
  rating: number;
  reason?: string;
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  score: number;
  opponents: number;
  performance?: number;
  format?: "classical" | "rapid" | "blitz";
  location?: string;
  position?: number;
  ratingChange?: number;
  gamesPlayed?: number;
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  gender: "M" | "F";
  state: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  gamesPlayed: number;
  status: "pending" | "approved" | "rejected";
  ratingStatus: "provisional" | "established";
  rapidRating: number;
  blitzRating: number;
  rapidGamesPlayed: number;
  blitzGamesPlayed: number;
  rapidRatingStatus: "provisional" | "established";
  blitzRatingStatus: "provisional" | "established";
  tournamentResults: TournamentResult[];
  ratingHistory: RatingHistoryEntry[];
  rapidRatingHistory: RatingHistoryEntry[];
  blitzRatingHistory: RatingHistoryEntry[];
  achievements: string[];
  title?: string;
  titleVerified?: boolean;
  birthYear?: number;
  club?: string;
  fideId?: string;
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  score: number;
  rating: number;
  tiebreak?: number;
  buchholz?: number;
  position: number;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  city: string;
  state: string;
  organizerId: string;
  players: Player[];
  pairings: Pairing[];
  rounds: number;
  currentRound: number;
  status: "draft" | "upcoming" | "ongoing" | "completed" | "cancelled" | "pending" | "approved" | "rejected" | "processed";
  timeControl: string;
  participants: number;
  registrationOpen: boolean;
  standings?: PlayerStanding[];
  category?: "classical" | "rapid" | "blitz";
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "player" | "tournament_organizer" | "rating_officer";
  status: string;
  phone: string;
  registrationDate: string;
}

export interface Organizer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "pending" | "approved" | "rejected";
  role: string;
  registrationDate: string;
}

export interface Pairing {
  id: string;
  tournamentId: string;
  round: number;
  player1Id: string;
  player2Id: string;
  result?: "*" | "1-0" | "0-1" | "1/2-1/2";
  player1RatingChange?: number;
  player2RatingChange?: number;
}

// Re-export the floor rating constant from the rating calculation module
export { FLOOR_RATING } from "@/lib/ratingCalculation";
