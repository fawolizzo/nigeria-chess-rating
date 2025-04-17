
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ClockIcon, LogOutIcon, RefreshCwIcon } from "lucide-react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const PendingApproval = () => {
  const { currentUser, logout, refreshUserData } = useUser();
  const navigate = useNavigate();
  
  // Redirect if user is not logged in or is already approved
  useEffect(() => {
    if (!currentUser) {
      logMessage(LogLevel.WARNING, 'PendingApproval', 'No user found, redirecting to login');
      navigate("/login");
      return;
    }
    
    // If user is approved, redirect to appropriate dashboard
    if (currentUser.status === "approved") {
      const dashboardPath = currentUser.role === "tournament_organizer" 
        ? "/organizer-dashboard" 
        : "/officer-dashboard";
      
      logMessage(LogLevel.INFO, 'PendingApproval', 
        `User ${currentUser.email} is approved, redirecting to ${dashboardPath}`);
      
      navigate(dashboardPath);
      return;
    }
    
    // If user is not a tournament organizer, redirect to home
    if (currentUser.role !== "tournament_organizer") {
      logMessage(LogLevel.WARNING, 'PendingApproval', 
        `User ${currentUser.email} with role ${currentUser.role} accessed pending approval page`);
      
      navigate("/");
      return;
    }
    
    logMessage(LogLevel.INFO, 'PendingApproval', `User ${currentUser.email} is in pending state`);
  }, [currentUser, navigate]);
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const handleRefresh = async () => {
    await refreshUserData();
    
    // After refresh, check if user is now approved
    if (currentUser?.status === "approved") {
      navigate("/organizer-dashboard");
    }
  };
  
  if (!currentUser) {
    return null; // Will redirect via useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-4xl mx-auto pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
          <div className="p-6 sm:p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-full">
                <ClockIcon className="h-12 w-12 text-amber-600 dark:text-amber-500" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Account Pending Approval
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-lg mx-auto">
              Your Tournament Organizer account is currently pending approval by a Rating Officer. 
              You'll receive an email once your account has been approved.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                className="flex items-center gap-2 w-full sm:w-auto"
                onClick={handleRefresh}
              >
                <RefreshCwIcon className="h-4 w-4" />
                Check Approval Status
              </Button>
              
              <Button
                variant="ghost"
                className="flex items-center gap-2 w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={handleLogout}
              >
                <LogOutIcon className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
