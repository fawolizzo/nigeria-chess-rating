
import * as z from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(11, "Phone number must be at least 11 digits"),
  state: z.string().min(1, "Please select your state"),
  role: z.enum(["tournament_organizer", "rating_officer"]),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

export type RegisterFormData = z.infer<typeof registerSchema>;
