import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Control } from 'react-hook-form';
import { z } from 'zod';

// Schema for login form
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .or(
      z.literal('').transform(() => {
        // For empty email, return the appropriate default based on role
        return 'ncro@ncr.com'; // Rating Officer will be handled in the form submission
      })
    ),
  password: z.string().min(1, 'Password or access code is required'),
  role: z.enum(['tournament_organizer', 'rating_officer']),
});

export type LoginFormData = z.infer<typeof loginSchema>;

type LoginFormInputsProps = {
  control: Control<LoginFormData>;
  showPassword: boolean;
  togglePasswordVisibility: () => void;
  selectedRole: 'tournament_organizer' | 'rating_officer';
};

const LoginFormInputs = ({
  control,
  showPassword,
  togglePasswordVisibility,
  selectedRole,
}: LoginFormInputsProps) => {
  // Get the appropriate label for the password field based on role
  const passwordLabel =
    selectedRole === 'rating_officer' ? 'Access Code' : 'Password';

  const passwordPlaceholder =
    selectedRole === 'rating_officer'
      ? 'Enter access code (RNCR25)'
      : 'Enter your password';

  const emailPlaceholder =
    selectedRole === 'rating_officer'
      ? 'ncro@ncr.com'
      : 'Enter your email address';

  const emailReadOnly = selectedRole === 'rating_officer';

  return (
    <>
      <FormField
        control={control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <FormControl>
                <Input
                  placeholder={emailPlaceholder}
                  className={`pl-10 ${emailReadOnly ? 'bg-gray-100' : ''}`}
                  type="email"
                  readOnly={emailReadOnly}
                  value={emailReadOnly ? 'ncro@ncr.com' : field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
              </FormControl>
            </div>
            {selectedRole === 'rating_officer' && (
              <FormDescription>
                Fixed email for Rating Officer login
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{passwordLabel}</FormLabel>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <FormControl>
                <Input
                  placeholder={passwordPlaceholder}
                  className="pl-10 pr-10"
                  type={showPassword ? 'text' : 'password'}
                  {...field}
                />
              </FormControl>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-10 px-3 text-gray-400 hover:text-gray-500"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {selectedRole === 'rating_officer' && (
              <FormDescription>Use RNCR25 as the access code</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
};

export default LoginFormInputs;
