
export interface Tournament {
  id: string;
  name: string;
  description?: string; // Add optional description
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
