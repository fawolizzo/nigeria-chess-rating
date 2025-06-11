
export interface RatingHistory {
  date: string;
  rating: number;
  change: number;
}

export interface Player {
  id: string;
  name: string;
  email: string;
  phone: string;
  fideId?: string;
  title?: "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM";
  titleVerified?: boolean;
  rating?: number;
  rapidRating?: number;
  blitzRating?: number;
  state: string;
  city: string;
  country?: string;
  gender?: "M" | "F";
  status: "pending" | "approved" | "rejected";
  profileImage?: string;
  about?: string;
  created_at?: string;
  gamesPlayed?: number;
  rapidGamesPlayed?: number;
  blitzGamesPlayed?: number;
  ratingStatus?: "provisional" | "established";
  rapidRatingStatus?: "provisional" | "established";
  blitzRatingStatus?: "provisional" | "established";
  ratingHistory?: RatingHistory[];
  rapidRatingHistory?: RatingHistory[];
  blitzRatingHistory?: RatingHistory[];
  achievements?: string[];
  club?: string;
  birthYear?: number;
}

export interface Pairing {
  table: number;
  white: string;
  black: string;
}

export interface Result {
  table: number;
  white: string;
  black: string;
  result: "1-0" | "0-1" | "1/2-1/2";
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
  status: "pending" | "approved" | "ongoing" | "completed" | "rejected";
  timeControl: string;
  rounds: number;
  currentRound: number;
  participants: number;
  registrationOpen: boolean;
  players: Player[];
  pairings: Pairing[];
  results: Result[];
  category?: "classical" | "rapid" | "blitz";
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: "player" | "tournament_organizer" | "rating_officer";
  status: "pending" | "approved" | "rejected";
  phone?: string;
  created_at?: string;
}

export interface PlayerWithScore extends Player {
  score: number;
  tiebreak?: number;
}
