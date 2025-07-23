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
  const [selectedRole, setSelectedRole] = useState<UserRole>(
    'tournament_organizer'
  );

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
      role: selectedRole,
    });

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        logMessage(LogLevel.ERROR, 'LoginForm', 'Login timeout');
        setError('Login timeout. Please try again.');
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    try {
      // Handle Rating Officer login
      if (selectedRole === 'rating_officer') {
        // Use the working demo account credentials
        const correctEmail = 'ncro@ncr.com';
        const correctPassword = 'RNCR25';

        // Check if user entered the correct email
        if (data.email !== correctEmail) {
          setError('Please use the correct Rating Officer email: ncro@ncr.com');
          setIsLoading(false);
          return;
        }

        // Check if user entered the correct password
        if (data.password !== correctPassword) {
          setError('Invalid access code for Rating Officer');
          setIsLoading(false);
          return;
        }

        logMessage(
          LogLevel.INFO,
          'LoginForm',
          'Attempting Rating Officer login',
          {
            email: data.email,
          }
        );

        const result = await signIn(data.email, data.password);

        logMessage(LogLevel.INFO, 'LoginForm', 'Rating Officer login result', {
          result,
        });

        if (result.error) {
          setError(
            result.error.message ||
              'Failed to sign in as Rating Officer. Please check your credentials.'
          );
          setIsLoading(false);
          return;
        }
      } else {
        // Standard Tournament Organizer login
        logMessage(
          LogLevel.INFO,
          'LoginForm',
          'Attempting Tournament Organizer login',
          {
            email: data.email,
          }
        );

        const result = await signIn(data.email, data.password);

        logMessage(
          LogLevel.INFO,
          'LoginForm',
          'Tournament Organizer login result',
          { result }
        );

        if (result.error) {
          setError(
            result.error.message ||
              'Invalid email or password. Please check your credentials.'
          );
          setIsLoading(false);
          return;
        }
      }

      logMessage(LogLevel.INFO, 'LoginForm', 'Login successful, redirecting', {
        role: selectedRole,
        redirectPath:
          selectedRole === 'rating_officer'
            ? '/officer-dashboard'
            : '/organizer-dashboard',
      });

      // Redirect to intended page or appropriate dashboard
      const redirectPath =
        selectedRole === 'rating_officer'
          ? '/officer-dashboard'
          : '/organizer-dashboard';

      // Add a small delay to ensure authentication state is updated
      setTimeout(() => {
        logMessage(LogLevel.INFO, 'LoginForm', 'Executing navigation', {
          redirectPath,
        });
        navigate(redirectPath, { replace: true });
      }, 500);
    } catch (err) {
      logMessage(LogLevel.ERROR, 'LoginForm', 'Login error', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Check if error is related to email confirmation
  const isEmailNotConfirmed =
    error &&
    (error.includes('Email not confirmed') ||
      error.includes('email_not_confirmed') ||
      error.includes('confirm your email'));

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError(null);
    setConfirmationSent(false);
    reset(); // Clear form when switching roles
  };

  // Force reset loading state on component mount
  useEffect(() => {
    setIsLoading(false);
  }, []);

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
          {/* Role Selection Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant={
                selectedRole === 'tournament_organizer' ? 'default' : 'outline'
              }
              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                selectedRole === 'tournament_organizer'
                  ? 'bg-green-600 hover:bg-green-700 border-green-600'
                  : 'border-gray-300 hover:border-green-600'
              }`}
              onClick={() => handleRoleChange('tournament_organizer')}
            >
              <Users className="h-6 w-6" />
              <span className="text-sm font-medium">Tournament Organizer</span>
            </Button>

            <Button
              type="button"
              variant={
                selectedRole === 'rating_officer' ? 'default' : 'outline'
              }
              className={`h-20 flex flex-col items-center justify-center gap-2 ${
                selectedRole === 'rating_officer'
                  ? 'bg-green-600 hover:bg-green-700 border-green-600'
                  : 'border-gray-300 hover:border-green-600'
              }`}
              onClick={() => handleRoleChange('rating_officer')}
            >
              <Shield className="h-6 w-6" />
              <span className="text-sm font-medium">Rating Officer</span>
            </Button>
          </div>

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
                  placeholder={
                    selectedRole === 'rating_officer'
                      ? 'rating.officer@ncrs.org'
                      : 'Enter your email address'
                  }
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
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 mb-2 font-medium">
              Demo Accounts:
            </p>
            <div className="text-xs space-y-1 text-gray-500">
              <p>
                <strong>Rating Officer:</strong> rating.officer@ncrs.org /
                password123
              </p>
              <p>
                <strong>Tournament Organizer:</strong>{' '}
                tournament.organizer@ncrs.org / password123
              </p>
            </div>
          </div>

          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-2 font-medium">
                Debug Info:
              </p>
              <div className="text-xs space-y-1 text-blue-500">
                <p>Form Loading: {isLoading ? 'Yes' : 'No'}</p>
                <p>Auth Loading: {authLoading ? 'Yes' : 'No'}</p>
                <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
                <p>Selected Role: {selectedRole}</p>
              </div>
              <div className="mt-2 space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsLoading(false);
                    setError(null);
                    resetAuthState();
                    logMessage(
                      LogLevel.INFO,
                      'LoginForm',
                      'Manual reset triggered'
                    );
                  }}
                  className="text-xs w-full"
                >
                  Reset Loading State
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    logMessage(
                      LogLevel.INFO,
                      'LoginForm',
                      'Force clearing auth state'
                    );
                    setIsLoading(false);
                    setError(null);
                    resetAuthState();
                    // Force clear any stored auth data
                    await supabase.auth.signOut();
                    // Reload the page to ensure clean state
                    window.location.reload();
                  }}
                  className="text-xs w-full"
                >
                  Force Clear & Reload
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    logMessage(
                      LogLevel.INFO,
                      'LoginForm',
                      'Testing direct login'
                    );
                    const success = await signIn(
                      'rating.officer@ncrs.org',
                      'password123'
                    );
                    logMessage(
                      LogLevel.INFO,
                      'LoginForm',
                      'Direct login result',
                      { success }
                    );
                  }}
                  className="text-xs w-full"
                >
                  Test Direct Login
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
