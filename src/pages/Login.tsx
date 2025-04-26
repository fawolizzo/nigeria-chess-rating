
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/login/LoginForm";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import LoginDebug from "@/components/LoginDebug";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, refreshUserData } = useUser();
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  
  // Debug logging for login page rendering
  useEffect(() => {
    logMessage(LogLevel.INFO, 'Login', 'Login page rendered', {
      isLoading,
      currentUserExists: !!currentUser,
      redirectingStatus: redirecting
    });
  }, [isLoading, currentUser, redirecting]);

  // Handle redirect after successful login - Fixed to properly handle redirection
  useEffect(() => {
    if (!isLoading && currentUser && !redirecting) {
      setRedirecting(true);
      
      logMessage(LogLevel.INFO, 'Login', 'User authenticated, redirecting', {
        userEmail: currentUser.email,
        userRole: currentUser.role,
        userStatus: currentUser.status,
      });

      const redirectPath = getRedirectPath(currentUser);
      logMessage(LogLevel.INFO, 'Login', `Redirecting to: ${redirectPath}`);
      
      // Add a small delay to ensure state updates before navigation
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500);
    }
  }, [currentUser, isLoading, navigate, redirecting]);
  
  // Handle loading states and timeouts
  useEffect(() => {
    let timer: number | null = null;
    
    if (isLoading) {
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      
      timer = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setLoadingDuration(elapsed);
        
        if (elapsed >= 8 && !showTimeout) {
          setShowTimeout(true);
          logMessage(LogLevel.WARNING, 'Login', 'Login verification is taking longer than expected', {
            elapsedTime: `${elapsed}s`,
          });
        }
      }, 1000);
    } else {
      setLoadingStartTime(null);
      setLoadingDuration(0);
      setShowTimeout(false);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLoading, showTimeout]);

  const handleManualRefresh = async () => {
    setShowTimeout(false);
    await refreshUserData();
  };

  // Loading state with spinner
  if (isLoading || redirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <LoadingSpinner />
          <p className="text-center text-gray-600 dark:text-gray-400">
            {redirecting ? 'Redirecting to dashboard...' : `Verifying your account... ${loadingDuration > 0 ? `(${loadingDuration}s)` : ''}`}
          </p>
          
          {showTimeout && !redirecting && (
            <div className="mt-6">
              <Alert variant="warning" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Verification is taking longer than expected. The server might be experiencing high load.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleManualRefresh} 
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Verification
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main login form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <LoginForm />
        
        {!import.meta.env.PROD && (
          <div className="mt-6">
            <LoginDebug />
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to determine redirect path
function getRedirectPath(user: { role: string; status?: string }) {
  if (user.role === 'rating_officer') {
    return '/officer-dashboard';
  } else if (user.role === 'tournament_organizer') {
    return user.status === 'pending' ? '/pending-approval' : '/organizer-dashboard';
  }
  return '/';
}

export default Login;
