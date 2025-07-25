import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSupabaseAuth } from '@/services/auth/useSupabaseAuth';
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
import { Loader2, Eye, EyeOff, Shield, Users, Mail, Lock } from 'lucide-react';
import { logMessage, LogLevel } from '@/utils/debugLogger';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password/Access Code is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type UserRole = 'rating_officer' | 'tournament_organizer';

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const authContext = useSupabaseAuth();
  const { signIn, isLoading: authLoading, isAuthenticated } = authContext;
  const resetAuthState = (authContext as any).resetAuthState;
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  // Debug authentication state
  useEffect(() => {
    logMessage(LogLevel.INFO, 'LoginForm', 'Auth state changed', {
      authLoading,
      isAuthenticated,
      isLoading,
      error,
    });

    // Log to console for easier debugging
    console.log('🔍 LoginForm Auth State:', {
      authLoading,
      isAuthenticated,
      isLoading,
      error,
      timestamp: new Date().toISOString(),
    });
  }, [authLoading, isAuthenticated, isLoading, error]);

  // Reset loading state if auth loading changes
  useEffect(() => {
    if (!authLoading && isLoading) {
      logMessage(LogLevel.INFO, 'LoginForm', 'Resetting loading state');
      setIsLoading(false);
    }
  }, [authLoading, isLoading]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
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
    if (isLoading || authLoading) {
      logMessage(
        LogLevel.WARNING,
        'LoginForm',
        'Login already in progress, ignoring submit'
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setConfirmationSent(false);

    logMessage(LogLevel.INFO, 'LoginForm', 'Starting login process', {
      email: data.email,
    });

    try {
      const { error } = await signIn(data.email, data.password);

      if (error) {
        setError(error.message);
      } else {
        navigate('/organizer-dashboard', { replace: true });
      }
    } catch (err) {
      logMessage(LogLevel.ERROR, 'LoginForm', 'Login error', err);
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Sign In
          </CardTitle>
          <CardDescription className="text-gray-600">
            Access your Nigeria Chess Rating System account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Login Form */}
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
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  className="pl-10"
                  {...register('email')}
                  disabled={isLoading || authLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                  {...register('password')}
                  disabled={isLoading || authLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading || authLoading}
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

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              disabled={isLoading || authLoading}
            >
              {isLoading || authLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to="/register-organizer"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Register
              </Link>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Are you a Rating Officer?{' '}
              <Link
                to="/login/ro"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Login here
              </Link>
            </p>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}
