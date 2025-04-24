
export interface Tournament {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  location: string;
  city: string;
  state: string;
  time_control: string;
  rounds: number;
  organizer_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'processed';
  created_at: string;
  updated_at: string;
}

export interface TournamentFormData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  city: string;
  state: string;
  rounds: number;
  timeControl: string;
  customTimeControl?: string;
}

// Alias for backward compatibility
export type TournamentFormValues = TournamentFormData;

// Define Player type to fix TypeScript error in tests
export interface Player {
  id: string;
  name: string;
  email: string;
  rating?: number;
  fide_id?: string;
}
