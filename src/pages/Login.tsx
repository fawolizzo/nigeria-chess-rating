
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
  const [redirecting, setRedirecting] = useState(false);
  
  // Debug logging for login page rendering
  useEffect(() => {
    logMessage(LogLevel.INFO, 'Login', 'Login page rendered', {
      isLoading,
      currentUserExists: !!currentUser,
      redirectingStatus: redirecting
    });
  }, []);
  
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
  
  useEffect(() => {
    // Skip if already redirecting or still loading
    if (redirecting || isLoading) return;
    
    // If user is logged in, redirect based on role and status
    if (currentUser) {
      setRedirecting(true);
      
      logMessage(LogLevel.INFO, 'Login', 'User authenticated, redirecting', {
        userEmail: currentUser.email,
        userRole: currentUser.role,
        userStatus: currentUser.status,
      });
      
      // Log the intended redirect path
      const redirectPath = currentUser.role === 'rating_officer' 
        ? '/officer-dashboard' 
        : (currentUser.role === 'tournament_organizer' 
            ? (currentUser.status === 'pending' 
                ? '/pending-approval' 
                : '/organizer-dashboard')
            : '/');
      
      logMessage(LogLevel.INFO, 'Login', `Redirecting to: ${redirectPath}`, {
        currentRole: currentUser.role,
        currentStatus: currentUser.status
      });
      
      // Delay the navigation slightly to ensure state updates properly
      setTimeout(() => {
        if (currentUser.role === 'rating_officer') {
          navigate('/officer-dashboard');
        } else if (currentUser.role === 'tournament_organizer') {
          if (currentUser.status === 'pending') {
            navigate('/pending-approval');
          } else if (currentUser.status === 'approved') {
            navigate('/organizer-dashboard');
          } else {
            navigate('/');
          }
        } else {
          navigate('/');
        }
      }, 100);
    }
  }, [currentUser, isLoading, navigate, redirecting]);

  const handleManualRefresh = async () => {
    setShowTimeout(false);
    await refreshUserData();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col">
        {isLoading && !redirecting ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-t-transparent border-nigeria-green rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Verifying your account... {loadingDuration > 0 && `(${loadingDuration}s)`}
            </p>
            
            {showTimeout && (
              <div className="mt-6 w-full">
                <Alert variant="warning" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Login verification is taking longer than expected. 
                    The server might be experiencing high load or network issues.
                  </AlertDescription>
                </Alert>
                
                <Button 
                  onClick={handleManualRefresh} 
                  className="flex items-center gap-2 w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4" />
                  Retry Verification
                </Button>
              </div>
            )}
          </div>
        ) : (
          <LoginForm />
        )}
        
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
