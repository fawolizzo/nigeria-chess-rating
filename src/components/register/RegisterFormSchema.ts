import * as z from 'zod';

export const registerSchema = z
  .object({
    fullName: z.string().min(3, 'Full name must be at least 3 characters'),
    email: z.string().email('Please enter a valid email address'),
    phoneNumber: z.string().min(11, 'Phone number must be at least 11 digits'),
    state: z.string().min(1, 'Please select your state'),
    role: z.enum(['tournament_organizer', 'rating_officer']),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      // Only validate password matching if it's a tournament organizer
      if (data.role === 'tournament_organizer') {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  )
  .refine(
    (data) => {
      // Require password for tournament organizers
      if (data.role === 'tournament_organizer') {
        return !!data.password && data.password.length >= 8;
      }
      return true;
    },
    {
      message:
        'Password is required and must be at least 8 characters for Tournament Organizers',
      path: ['password'],
    }
  );

export type RegisterFormData = z.infer<typeof registerSchema>;
