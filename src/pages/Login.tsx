
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import LoginDebug from "@/components/LoginDebug";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useSupabaseAuth();
  const { currentUser } = useUser();
  const [loadingTime, setLoadingTime] = useState(0);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  
  // Set a maximum loading time
  const MAX_LOADING_TIME = 5; // seconds
  
  // Timer to track loading duration for user feedback
  useEffect(() => {
    if (!isLoading) {
      // Reset timer when not loading
      setLoadingTime(0);
      setHasTimedOut(false);
      return;
    }
    
    const intervalId = setInterval(() => {
      const newTime = loadingTime + 1;
      setLoadingTime(newTime);
      
      // Check for timeout
      if (newTime >= MAX_LOADING_TIME) {
        setHasTimedOut(true);
        logMessage(LogLevel.WARNING, 'Login', 'Login verification timed out', {
          loadingDuration: `${newTime}s`,
          timestamp: new Date().toISOString()
        });
      }
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isLoading, loadingTime]);
  
  // Handle authentication and redirection
  useEffect(() => {
    // Force reload if stuck loading for too long
    if (hasTimedOut && isLoading) {
      const forceReloadTimeout = setTimeout(() => {
        // Force state reset after timeout
        window.location.reload();
      }, 10000); // Give extra time in case loading finishes
      
      return () => clearTimeout(forceReloadTimeout);
    }
    
    // Only redirect when not loading and either authenticated or have user data
    if (!isLoading) {
      if (isAuthenticated || currentUser) {
        logMessage(LogLevel.INFO, 'Login', 'User authenticated, redirecting', {
          userEmail: currentUser?.email || user?.email,
          userRole: currentUser?.role,
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
      }
    }
  }, [isAuthenticated, isLoading, currentUser, navigate, user, hasTimedOut]);

  // Show loading indicator with timeout information
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nigeria-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying login status...</p>
          <p className="text-xs text-gray-500 mt-2">
            Waiting for {loadingTime}s
          </p>
          
          {hasTimedOut && (
            <div className="mt-6 space-y-3">
              <p className="text-amber-600 text-sm">
                Login verification is taking longer than expected.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-nigeria-green text-white rounded hover:bg-nigeria-green-dark"
              >
                Reload Page
              </button>
              <button 
                onClick={() => {
                  // Clear any persisted auth data and force reload
                  localStorage.removeItem('sb-caagbqzwkgfhtzyizyzy-auth-token');
                  localStorage.removeItem('ncr_current_user');
                  window.location.href = '/login';
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 block w-full"
              >
                Clear Login Data & Retry
              </button>
            </div>
          )}
        </div>
        
        {/* Add debug component for development only */}
        <div className="fixed bottom-4 right-4">
          <LoginDebug />
        </div>
      </div>
    );
  }

  // Only show login form if not authenticated
  if (!isAuthenticated && !currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default Login;
