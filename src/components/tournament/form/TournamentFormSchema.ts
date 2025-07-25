import { z } from 'zod';

export const createTournamentSchema = z.object({
  name: z.string().min(1, 'Tournament name is required'),
  description: z.string().optional(),
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().min(1, 'Location is required'),
  state: z.string().min(1, 'State is required'),
  city: z.string().min(1, 'City is required'),
  rounds: z.number().min(1, 'Number of rounds must be at least 1'),
  timeControl: z.string().min(1, 'Time control is required'),
  registrationOpen: z.boolean().default(true),
});

// Export as tournamentSchema as well for backward compatibility
export const tournamentSchema = createTournamentSchema;

export type CreateTournamentFormData = z.infer<typeof createTournamentSchema>;
export type TournamentFormData = CreateTournamentFormData;
export type TournamentFormSchemaType = CreateTournamentFormData;
