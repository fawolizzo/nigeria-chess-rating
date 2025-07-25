import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Loader2, Mail, Lock } from 'lucide-react';
import { logMessage, LogLevel } from '@/utils/debugLogger';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  accessCode: z.string().min(1, 'Access Code is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function RatingOfficerLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    logMessage(LogLevel.INFO, 'RatingOfficerLoginForm', 'Starting login process', {
      email: data.email,
    });

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.accessCode,
      });

      if (error) {
        setError(error.message);
      } else {
        navigate('/officer-dashboard', { replace: true });
      }
    } catch (err) {
      logMessage(LogLevel.ERROR, 'RatingOfficerLoginForm', 'Login error', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Rating Officer Login
          </CardTitle>
          <CardDescription className="text-gray-600">
            Access your Nigeria Chess Rating System account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
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
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="accessCode"
                className="text-sm font-medium text-gray-700"
              >
                Access Code
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="accessCode"
                  type="password"
                  placeholder="Enter your access code"
                  className="pl-10"
                  {...register('accessCode')}
                  disabled={isLoading}
                />
              </div>
              {errors.accessCode && (
                <p className="text-sm text-red-600">
                  {errors.accessCode.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white font-medium"
              disabled={isLoading}
            >
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
        </CardContent>
      </Card>
    </div>
  );
}
