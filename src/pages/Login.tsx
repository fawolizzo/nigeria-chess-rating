
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/login/LoginForm";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import LoginDebug from "@/components/LoginDebug";

const Login = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading } = useUser();
  
  // Simple redirect logic
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <LoginForm />
        
        {/* Show debug info in development */}
        {!import.meta.env.PROD && (
          <div className="mt-6">
            <LoginDebug />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
