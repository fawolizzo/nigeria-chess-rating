import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface RoleGateProps {
  children: React.ReactNode;
  role?: UserRole | UserRole[];
  requireActive?: boolean;
  fallbackPath?: string;
}

export function RoleGate({
  children,
  role,
  requireActive = true,
  fallbackPath = '/login',
}: RoleGateProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user || !profile) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check if user status is active (if required)
  if (requireActive && profile.status !== 'active') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert className="max-w-md mx-auto">
          <AlertDescription>
            {profile.status === 'pending' && (
              <>
                Your account is pending approval. Please wait for a Rating
                Officer to approve your account.
              </>
            )}
            {profile.status === 'rejected' && (
              <>
                Your account has been rejected. Please contact support for more
                information.
              </>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check role requirements
  if (role) {
    const allowedRoles = Array.isArray(role) ? role : [role];
    const userRole = profile.role;

    if (!allowedRoles.includes(userRole)) {
      return (
        <div className="container mx-auto px-4 py-8">
          <Alert className="max-w-md mx-auto">
            <AlertDescription>
              You don't have permission to access this page. Required role:{' '}
              {allowedRoles.join(' or ')}.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function TOGate({ children, ...props }: Omit<RoleGateProps, 'role'>) {
  return (
    <RoleGate role="TO" {...props}>
      {children}
    </RoleGate>
  );
}

export function ROGate({ children, ...props }: Omit<RoleGateProps, 'role'>) {
  return (
    <RoleGate role="RO" {...props}>
      {children}
    </RoleGate>
  );
}

export function AuthGate({ children, ...props }: Omit<RoleGateProps, 'role'>) {
  return <RoleGate {...props}>{children}</RoleGate>;
}
