export interface User {
  id: string;
  fullName: string;
  email: string;
  role: "player" | "tournament_organizer" | "rating_officer";
  status: "pending" | "approved" | "rejected";
  profileImageUrl?: string;
}

export interface RatingHistory {
  date: string;
  rating: number;
  reason: string;
}

export interface TournamentResult {
  tournamentId: string;
  tournamentName: string;
  date: string;
  result: string;
  ratingChange: number;
}

export interface Player {
  id: string;
  name: string;
  rating: number;
  gender: "M" | "F";
  state?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  status?: "pending" | "approved" | "rejected";
  gamesPlayed: number;
  title?: string;
  titleVerified?: boolean;
  club?: string;
  birthYear?: number;
  ratingHistory: RatingHistory[];
  tournamentResults: TournamentResult[];
  rapidRating: number;
  blitzRating: number;
  rapidGamesPlayed: number;
  blitzGamesPlayed: number;
  ratingStatus: "provisional" | "established";
  rapidRatingStatus: "provisional" | "established";
  blitzRatingStatus: "provisional" | "established";
  rapidRatingHistory?: RatingHistory[];
  blitzRatingHistory?: RatingHistory[];
}

export interface TournamentPairing {
  roundNumber: number;
  matches: {
    whiteId: string;
    blackId: string;
    result?: "1-0" | "0-1" | "1/2-1/2" | "*";
    whiteRatingChange?: number;
    blackRatingChange?: number;
  }[];
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  points: number;
  tieBreak1?: number;
  tieBreak2?: number;
}

export interface Tournament {
  id: string;
  name: string;
  organizer: string;
  organizerId: string;
  hostId?: string;
  date: string;
  location: string;
  city: string;
  state: string;
  status: "pending" | "approved" | "rejected" | "upcoming" | "ongoing" | "completed" | "processed";
  players: Player[];
  totalRounds: number;
  currentRound: number;
  category?: string;
  timeControl: string;
  description?: string;
  pairings?: TournamentPairing[];
  standings?: PlayerStanding[];
  processingDate?: string;
}

export interface DashboardData {
  pendingTournaments: Tournament[];
  completedTournaments: Tournament[];
  pendingPlayers: Player[];
  pendingOrganizers: User[];
}
