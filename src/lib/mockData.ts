export interface Player {
  id: string;
  name: string;
  email: string;
  phone: string;
  fideId?: string;
  title?: "GM" | "IM" | "FM" | "CM" | "WGM" | "WIM" | "WFM" | "WCM";
  rating?: number;
  state: string;
  city: string;
  status: "pending" | "approved" | "rejected";
  profileImage?: string;
  about?: string;
  created_at?: string;
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
