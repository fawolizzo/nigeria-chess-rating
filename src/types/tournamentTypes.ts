export interface TournamentFormData {
  name: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  location: string;
  state: string;
  city: string;
  rounds: number;
  timeControl: string;
  registrationOpen?: boolean;
  customTimeControl?: string;
}

export interface Tournament {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  city: string;
  state: string;
  organizer_id: string;
  status:
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'ongoing'
    | 'completed'
    | 'processed';
  time_control: string;
  rounds: number;
  current_round: number;
  participants: number;
  registration_open: boolean;
  players?: any[];
  pairings?: any[];
  results?: any[];
  category?: 'classical' | 'rapid' | 'blitz';
  created_at?: string;
  updated_at?: string;
}
