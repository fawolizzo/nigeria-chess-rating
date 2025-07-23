import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password/Access Code is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [email, setEmail] = useState('');

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Check if this is a Rating Officer login
  const isRatingOfficer = email === 'rating.officer@ncrs.org';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const handleResendConfirmation = async (email: string) => {
    setResendingConfirmation(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm-email`,
        },
      });

      if (error) {
        setError(error.message);
      } else {
        setConfirmationSent(true);
      }
    } catch (err) {
      setError('Failed to resend confirmation email. Please try again.');
    } finally {
      setResendingConfirmation(false);
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);
    setConfirmationSent(false);

    try {
      // Handle Rating Officer login with access code
      if (
        data.email === 'rating.officer@ncrs.org' ||
        data.email === 'ncro@ncr.com'
      ) {
        // Verify access code (hardcoded for demo - in production use Edge Function)
        const validAccessCode =
          data.email === 'ncro@ncr.com' ? 'RNCR25' : 'RO2024!';

        if (data.password !== validAccessCode) {
          setError('Invalid access code for Rating Officer');
          return;
        }

        // For the existing account, the access code IS the password
        // For new accounts, we'd use a separate password
        const actualPassword =
          data.email === 'ncro@ncr.com' ? 'RNCR25' : 'password123';
        const { error: signInError } = await signIn(data.email, actualPassword);

        if (signInError) {
          setError(signInError.message);
          return;
        }
      } else {
        // Standard Tournament Organizer login
        const { error: signInError } = await signIn(data.email, data.password);

        if (signInError) {
          setError(signInError.message);
          return;
        }
      }

      // Redirect to intended page or home
      navigate(from, { replace: true });
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check if error is related to email confirmation
  const isEmailNotConfirmed =
    error &&
    (error.includes('Email not confirmed') ||
      error.includes('email_not_confirmed') ||
      error.includes('confirm your email'));

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access the Nigerian Chess Rating System
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {confirmationSent && (
              <Alert>
                <AlertDescription>
                  Confirmation email sent! Check your inbox and click the link
                  to confirm your email address.
                </AlertDescription>
              </Alert>
            )}

            {error && !isEmailNotConfirmed && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isEmailNotConfirmed && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Your email address has not been confirmed yet.</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const emailValue = (
                          document.getElementById('email') as HTMLInputElement
                        )?.value;
                        if (emailValue) {
                          handleResendConfirmation(emailValue);
                        }
                      }}
                      disabled={resendingConfirmation}
                      className="w-full"
                    >
                      {resendingConfirmation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Resend Confirmation Email'
                      )}
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                {...register('email')}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                {isRatingOfficer ? 'Access Code' : 'Password'}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={
                    isRatingOfficer
                      ? 'Enter access code (e.g., RO2024!)'
                      : 'Enter your password'
                  }
                  {...register('password')}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register-organizer"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Register as Tournament Organizer
              </Link>
            </p>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Demo Accounts:</p>
            <div className="text-xs space-y-1">
              <p>
                <strong>Rating Officer:</strong> ncro@ncr.com / RNCR25
              </p>
              <p>
                <strong>Tournament Organizer:</strong>{' '}
                tournament.organizer@ncrs.org / password123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
