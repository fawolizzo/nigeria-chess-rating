
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, session, user } = useSupabaseAuth();
  const { currentUser } = useUser();
  
  useEffect(() => {
    // Enhanced diagnostic logging
    logMessage(LogLevel.INFO, 'Login', '[DIAGNOSTICS] Auth state check', { 
      isAuthenticated, 
      isLoading, 
      hasCurrentUser: !!currentUser,
      hasSupabaseUser: !!user,
      hasSupabaseSession: !!session,
      timestamp: new Date().toISOString()
    });
    
    // Only redirect when not loading and either authenticated or have user data
    if (!isLoading) {
      if (isAuthenticated || currentUser) {
        logMessage(LogLevel.INFO, 'Login', '[DIAGNOSTICS] User authenticated, redirecting', {
          userEmail: currentUser?.email || user?.email,
          userRole: currentUser?.role,
          userStatus: currentUser?.status,
          timestamp: new Date().toISOString()
        });
        
        // Determine where to redirect based on user role
        if (currentUser?.role === 'rating_officer') {
          navigate('/officer-dashboard');
        } else if (currentUser?.role === 'tournament_organizer') {
          if (currentUser.status === 'pending') {
            navigate('/pending-approval');
          } else if (currentUser.status === 'approved') {
            navigate('/organizer-dashboard');
          }
        }
      } else {
        logMessage(LogLevel.INFO, 'Login', '[DIAGNOSTICS] User not authenticated', {
          timestamp: new Date().toISOString()
        });
      }
    }
  }, [isAuthenticated, isLoading, currentUser, navigate, user, session]);

  // Show loading indicator
  if (isLoading) {
    logMessage(LogLevel.INFO, 'Login', '[DIAGNOSTICS] Showing loading state', {
      loadingDuration: `${Date.now() - (window.authLoadStartTime || Date.now())}ms`,
      timestamp: new Date().toISOString()
    });
    
    // Set a global timestamp for load start if not already set
    if (!window.authLoadStartTime) {
      window.authLoadStartTime = Date.now();
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nigeria-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying login status...</p>
          <p className="text-xs text-gray-500 mt-2">
            Waiting for {Math.round((Date.now() - (window.authLoadStartTime || Date.now())) / 1000)}s
          </p>
        </div>
      </div>
    );
  }

  // Only show login form if not authenticated
  if (!isAuthenticated && !currentUser) {
    logMessage(LogLevel.INFO, 'Login', '[DIAGNOSTICS] Showing login form', {
      timestamp: new Date().toISOString()
    });
    
    // Reset load start time
    window.authLoadStartTime = undefined;
    
    return <LoginForm />;
  }

  logMessage(LogLevel.INFO, 'Login', '[DIAGNOSTICS] Showing redirect state', {
    timestamp: new Date().toISOString()
  });

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    authLoadStartTime?: number;
  }
}

export default Login;
