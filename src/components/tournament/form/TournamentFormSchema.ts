
import { z } from "zod";

export const createTournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  location: z.string().min(1, "Location is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  rounds: z.number().min(1, "Number of rounds must be at least 1"),
  timeControl: z.string().min(1, "Time control is required"),
  registrationOpen: z.boolean().default(true),
});

export type CreateTournamentFormData = z.infer<typeof createTournamentSchema>;
