
export interface TournamentFormValues {
  name: string;
  description: string; // Ensures description is part of the form values
  startDate: Date;
  endDate: Date;
  location: string;
  city: string;
  state: string;
  rounds: number;
  timeControl: string;
}
