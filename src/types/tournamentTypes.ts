
export interface Player {
  id: string;
  name: string;
  rating: number;
  blitzRating?: number;
  rapidRating?: number;
  nationalId: string;
  state: string;
  status: 'pending' | 'approved' | 'rejected';
  organizerId: string;
  gamesPlayed?: number;
  registrationDate: string;
  lastModified: number;
}

export interface Match {
  whiteId: string;
  blackId: string | null;
  result: "1-0" | "0-1" | "1/2-1/2" | "*";
}

export interface Pairing {
  roundNumber: number;
  matches: Match[];
}

export interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  venue: string;
  state: string;
  city: string;
  rounds: number;
  currentRound?: number;
  timeControl: string;
  organizerId: string;
  registrationOpen: boolean;
  status: 'upcoming' | 'ongoing' | 'completed' | 'processed' | 'pending';
  players?: string[];
  pairings?: Pairing[];
  createdAt: string;
  lastModified: number;
}

export interface PlayerStanding {
  playerId: string;
  playerName: string;
  rating: number;
  score: number;
  tiebreaks: number[];
  opponents: string[];
}
