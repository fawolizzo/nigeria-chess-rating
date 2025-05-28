
export interface RatingHistoryEntry {
  date: string;
  rating: number;
  reason?: string; // Add optional reason field
}

export interface Pairing {
  round: number;
  player1Id: string;
  player2Id: string;
  result: "1-0" | "0-1" | "1/2-1/2";
}

export interface Standing {
  playerId: string;
  points: number;
  tieBreak1: number;
  tieBreak2: number;
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  gender: "M" | "F";
  state: string;
  city: string;
  country: string;
  status: "pending" | "approved" | "rejected";
  gamesPlayed: number;
  phone: string;
  email: string;
  ratingHistory: RatingHistoryEntry[];
  tournamentResults: TournamentResult[];
  // Add missing multi-format rating properties
  rapidRating: number;
  blitzRating: number;
  rapidGamesPlayed: number;
  blitzGamesPlayed: number;
  ratingStatus: "provisional" | "established";
  rapidRatingStatus: "provisional" | "established";
  blitzRatingStatus: "provisional" | "established";
  // Add missing rating history for different formats
  rapidRatingHistory: RatingHistoryEntry[];
  blitzRatingHistory: RatingHistoryEntry[];
  // Add missing optional properties
  title?: string;
  titleVerified?: boolean;
  achievements?: string[];
  fideId?: string;
  birthYear?: number;
  club?: string;
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
  status: "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed";
  rounds: number;
  currentRound: number;
  category: "classical" | "rapid" | "blitz";
  timeControl: string;
  participants: number;
  registrationOpen: boolean;
  players: Player[];
  pairings: Pairing[];
  standings: Standing[];
  createdAt: string;
  updatedAt: string;
  processingDate?: string; // Add optional processing date
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  ratingChange: number;
  newRating: number;
  // Add missing properties
  format: "classical" | "rapid" | "blitz";
  location: string;
  score: number;
  gamesPlayed: number;
  position: number;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: "player" | "tournament_organizer" | "rating_officer";
  status: "pending" | "approved" | "rejected";
  phone: string;
  // Add missing property
  registrationDate: string;
}
