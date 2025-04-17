
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const Login = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useSupabaseAuth();
  const { currentUser } = useUser();

  // Handle redirection for already authenticated users
  useEffect(() => {
    // Log detailed state for debugging
    logMessage(LogLevel.INFO, 'Login', 'Auth state check', { 
      isAuthenticated, 
      isLoading, 
      hasCurrentUser: !!currentUser,
      currentUserDetails: currentUser ? {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.role,
        status: currentUser.status
      } : null
    });
    
    // Only redirect when auth loading is complete AND we have either authentication or a current user
    if (!isLoading && (isAuthenticated || currentUser)) {
      logMessage(LogLevel.INFO, 'Login', 'User already authenticated, redirecting', { 
        role: currentUser?.role, 
        status: currentUser?.status 
      });
      
      // Determine where to redirect based on user role and status
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
  }, [isAuthenticated, isLoading, currentUser, navigate]);

  // Show loading indicator while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-nigeria-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication state...</p>
        </div>
      </div>
    );
  }

  // Only show the login form if not authenticated
  if (!isAuthenticated && !currentUser) {
    return <LoginForm />;
  }

  // This should never render as the useEffect should redirect authenticated users
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  );
};

export default Login;
