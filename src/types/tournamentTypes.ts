
// Define the Player interface
export interface Player {
  id: string;
  name: string;
  rating?: number;
  nationalId?: string;
  state?: string;
  status: 'active' | 'inactive' | 'pending' | 'approved'; // Added 'approved' status
  gamesPlayed?: number;
  organizerId?: string;
  registrationDate?: string;
  lastModified?: number;
  fideId?: string;
  federation?: string;
  dateOfBirth?: string;
  email?: string;
  phone?: string;
}

// Define the Pairing interface
export interface Pairing {
  roundNumber: number;
  matches: {
    whiteId: string;
    blackId: string;
    result: '1-0' | '0-1' | '1/2-1/2' | '*';
  }[];
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
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
  status: 'upcoming' | 'ongoing' | 'completed' | 'processed' | 'pending' | 'draft'; // Added 'draft' status
  players?: string[];
  pairings?: Pairing[];
  createdAt: string;
  lastModified: number;
}

export interface TournamentFormValues {
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  location: string;
  city: string;
  state: string;
  rounds: number;
  timeControl: string;
}
