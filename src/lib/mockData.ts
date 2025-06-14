export interface RatingHistory {
  date: string;
  rating: number;
  change: number;
  reason?: string;
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  result: string;
  opponent: string;
  ratingChange: number;
  format: "classical" | "rapid" | "blitz";
  location?: string;
  position?: number;
  score?: number;
  gamesPlayed?: number;
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
  tournamentResults?: TournamentResult[];
}

export interface Pairing {
  table: number;
  white: string;
  black: string;
  roundNumber?: number;
  matches?: any[];
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
  start_date: string;
  end_date: string;
  location: string;
  rounds: number;
  time_control: string;
  description: string;
  organizer_id: string;
  status: "pending" | "approved" | "rejected" | "ongoing" | "completed" | "processed";
  participants: number;
  current_round: number;
  registration_open: boolean;
  created_at: string;
  updated_at: string;
  city: string;
  state: string;
  players?: Player[];
  pairings?: Pairing[];
  results?: Result[];
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

// Export type alias for backward compatibility
export type RatingHistoryEntry = RatingHistory;
