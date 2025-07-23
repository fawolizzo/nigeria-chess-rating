import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ConfirmationSent() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || 'your email address';

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a confirmation link to{' '}
            <span className="font-medium">{email}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Click the link in your email to confirm your account and complete
              registration. The link will expire in 24 hours.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              After confirming your email, you'll be able to sign in to the
              Nigerian Chess Rating System.
            </p>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2">
                <strong>Note:</strong> Your account is pending approval by a
                Rating Officer. You'll receive another email once your account
                is approved.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button asChild className="w-full">
              <Link to="/login">Go to Sign In</Link>
            </Button>

            <Button variant="ghost" asChild className="w-full">
              <Link to="/" className="inline-flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
