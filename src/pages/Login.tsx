
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useSupabaseAuth();
  const { currentUser } = useUser();
  const [loadingTime, setLoadingTime] = useState(0);
  
  // Timer to track loading duration for user feedback
  useEffect(() => {
    if (!isLoading) return;
    
    // Set a global timestamp for load start if not already set
    if (!window.authLoadStartTime) {
      window.authLoadStartTime = Date.now();
    }
    
    const intervalId = setInterval(() => {
      setLoadingTime(Math.round((Date.now() - (window.authLoadStartTime || Date.now())) / 1000));
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [isLoading]);
  
  // Add safety timeout to prevent infinite loading
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        logMessage(LogLevel.WARNING, 'Login', 'Forced timeout on login page loading', {
          loadingDuration: `${Date.now() - (window.authLoadStartTime || Date.now())}ms`,
          timestamp: new Date().toISOString()
        });
        window.authLoadStartTime = undefined;
      }
    }, 8000); // Force timeout after 8 seconds
    
    return () => clearTimeout(timeoutId);
  }, []);
  
  // Handle authentication and redirection
  useEffect(() => {
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
  }, [isAuthenticated, isLoading, currentUser, navigate, user]);

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
          {loadingTime > 5 && (
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-nigeria-green text-white rounded hover:bg-nigeria-green-dark"
            >
              Reload Page
            </button>
          )}
        </div>
      </div>
    );
  }

  // Only show login form if not authenticated
  if (!isAuthenticated && !currentUser) {
    // Reset load start time
    window.authLoadStartTime = undefined;
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

// Add TypeScript declaration for the global window object
declare global {
  interface Window {
    authLoadStartTime?: number;
  }
}

export default Login;
