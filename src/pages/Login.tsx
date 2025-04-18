
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import LoginDebug from "@/components/LoginDebug";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import SyncStatusIndicator from "@/components/SyncStatusIndicator";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useSupabaseAuth();
  const { currentUser, forceSync } = useUser();
  const [localLoading, setLocalLoading] = useState(true);
  const [loadingTime, setLoadingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Direct check for authentication - simplified approach
  useEffect(() => {
    // Clear any existing error when component mounts
    setError(null);
    
    // Initial loading delay - brief to allow auth to initialize
    const initialTimer = setTimeout(() => {
      setLocalLoading(false);
    }, 2000);
    
    // Sync user data on load
    const syncData = async () => {
      try {
        await forceSync();
      } catch (err) {
        // Sync errors are non-critical
        logMessage(LogLevel.WARNING, 'Login', 'Error syncing data on login page load', {
          error: err instanceof Error ? err.message : String(err),
        });
      }
    };
    
    syncData();
    
    return () => {
      clearTimeout(initialTimer);
    };
  }, []);
  
  // Simple loading timer
  useEffect(() => {
    if (!isLoading && !localLoading) return;
    
    const timerInterval = setInterval(() => {
      setLoadingTime(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, [isLoading, localLoading]);
  
  // Simple redirect logic with safeguards
  useEffect(() => {
    // Only proceed with redirect logic if not in loading state
    if (isLoading || localLoading) return;
    
    // Authenticated user found - proceed with redirect
    if (isAuthenticated || currentUser) {
      logMessage(LogLevel.INFO, 'Login', 'User authenticated, redirecting', {
        userEmail: currentUser?.email || user?.email,
        userRole: currentUser?.role,
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
  }, [isAuthenticated, isLoading, localLoading, currentUser, navigate, user]);
  
  // Handle manual refresh
  const handleManualRefresh = () => {
    logMessage(LogLevel.INFO, 'Login', 'Manual refresh triggered');
    window.location.reload();
  };
  
  // Handle clearing login data
  const handleClearLoginData = () => {
    logMessage(LogLevel.INFO, 'Login', 'Clearing login data and refreshing');
    localStorage.removeItem('sb-caagbqzwkgfhtzyizyzy-auth-token');
    localStorage.removeItem('ncr_current_user');
    sessionStorage.removeItem('ncr_current_user');
    window.location.href = '/login';
  };
  
  // Handle force sync
  const handleForceSync = async () => {
    logMessage(LogLevel.INFO, 'Login', 'Force sync triggered');
    setLocalLoading(true);
    
    try {
      await forceSync();
      setError(null);
    } catch (err) {
      setError('Failed to sync user data. Please try refreshing the page.');
    } finally {
      setLocalLoading(false);
    }
  };
  
  // Timeout protection - if loading for too long, show error/recovery options
  const isTimedOut = loadingTime > 5;
  
  // Show loading state
  if (isLoading || localLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {!isTimedOut ? (
            <>
              <Loader2 className="w-12 h-12 animate-spin mx-auto text-nigeria-green mb-4" />
              <h2 className="text-xl font-medium text-gray-700 dark:text-gray-300 mb-2">
                Verifying login status...
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {loadingTime > 0 ? `Waiting for ${loadingTime}s` : 'Initializing...'}
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
              <h2 className="text-xl font-medium text-amber-600 dark:text-amber-400 mb-2">
                Login verification is taking longer than expected
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                This could be due to network issues or a temporary system delay.
              </p>
            </>
          )}
          
          {isTimedOut && (
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <Button 
                onClick={handleManualRefresh}
                className="bg-nigeria-green hover:bg-nigeria-green-dark"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
              
              <Button 
                onClick={handleForceSync}
                variant="outline"
                className="border-nigeria-green text-nigeria-green hover:bg-nigeria-green/10"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Force Sync
              </Button>
              
              <Button 
                onClick={handleClearLoginData}
                variant="outline"
                className="mt-2"
              >
                Clear Login Data & Retry
              </Button>
            </div>
          )}
          
          {/* Show sync indicator in development */}
          {!import.meta.env.PROD && (
            <div className="mt-6 w-full max-w-md">
              <p className="text-xs text-gray-500 mb-2">Development Tools:</p>
              <SyncStatusIndicator prioritizeUserData forceShow />
              <LoginDebug />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state if there was a problem
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-medium text-red-600 dark:text-red-400 mb-2">
            Authentication Error
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {error}
          </p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <Button 
              onClick={handleManualRefresh}
              className="bg-nigeria-green hover:bg-nigeria-green-dark"
            >
              Reload Page
            </Button>
            <Button 
              onClick={handleClearLoginData}
              variant="outline"
            >
              Clear Login Data & Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Only show login form if not authenticated
  if (!isAuthenticated && !currentUser) {
    return <LoginForm />;
  }

  // Redirecting state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-nigeria-green mb-2" />
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default Login;
