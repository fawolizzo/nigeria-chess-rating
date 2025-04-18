
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/login/LoginForm";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import LoginDebug from "@/components/LoginDebug";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, refreshUserData } = useUser();
  const [loadingDuration, setLoadingDuration] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);
  const [loadingStartTime, setLoadingStartTime] = useState<number | null>(null);
  
  // Track loading time
  useEffect(() => {
    let timer: number | null = null;
    
    if (isLoading) {
      const startTime = Date.now();
      setLoadingStartTime(startTime);
      
      timer = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setLoadingDuration(elapsed);
        
        // After 10 seconds, show timeout warning
        if (elapsed >= 10 && !showTimeout) {
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
  
  // Handle navigation based on user role
  useEffect(() => {
    if (isLoading) return;
    
    if (currentUser) {
      logMessage(LogLevel.INFO, 'Login', 'User authenticated, redirecting', {
        userEmail: currentUser.email,
        userRole: currentUser.role,
      });
      
      // Determine where to redirect based on user role
      if (currentUser.role === 'rating_officer') {
        navigate('/officer-dashboard');
      } else if (currentUser.role === 'tournament_organizer') {
        if (currentUser.status === 'pending') {
          navigate('/pending-approval');
        } else if (currentUser.status === 'approved') {
          navigate('/organizer-dashboard');
        }
      }
    }
  }, [currentUser, isLoading, navigate]);

  // Handle manual refresh of user data
  const handleManualRefresh = async () => {
    setShowTimeout(false);
    await refreshUserData();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 border-4 border-t-transparent border-nigeria-green rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Verifying your account... {loadingDuration > 0 && `(${loadingDuration}s)`}
            </p>
            
            {showTimeout && (
              <div className="mt-6">
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Login verification is taking longer than expected. 
                    The server might be experiencing high load or network issues.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleManualRefresh} 
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Verification
                </Button>
                
                <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded text-xs text-left overflow-auto max-h-60">
                  <h4 className="font-semibold mb-2">Login Debug Information:</h4>
                  <p>Start time: {loadingStartTime ? new Date(loadingStartTime).toISOString() : 'N/A'}</p>
                  <p>Duration: {loadingDuration} seconds</p>
                  <LoginDebug />
                </div>
              </div>
            )}
          </div>
        ) : (
          <LoginForm />
        )}
        
        {/* Show debug info in development when not loading */}
        {!isLoading && !import.meta.env.PROD && (
          <div className="mt-6">
            <LoginDebug />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
