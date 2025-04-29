
import * as z from "zod";

export const tournamentSchema = z.object({
  name: z.string().min(5, "Tournament name must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  startDate: z.date({
    required_error: "Start date is required",
    invalid_type_error: "Start date is invalid",
  }),
  endDate: z.date({
    required_error: "End date is required",
    invalid_type_error: "End date is invalid",
  }),
  location: z.string().min(3, "Location is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  rounds: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().min(1)
  ),
  timeControl: z.string().min(2, "Time control is required")
}).refine(data => {
  return data.startDate instanceof Date && !isNaN(data.startDate.getTime()) &&
         data.endDate instanceof Date && !isNaN(data.endDate.getTime());
}, {
  message: "Both start date and end date must be valid dates",
  path: ["startDate"]
}).refine(data => {
  if (data.startDate instanceof Date && !isNaN(data.startDate.getTime()) &&
      data.endDate instanceof Date && !isNaN(data.endDate.getTime())) {
    return data.endDate >= data.startDate;
  }
  return true;
}, {
  message: "End date must be on or after start date",
  path: ["endDate"]
});

export type TournamentFormSchemaType = z.infer<typeof tournamentSchema>;
