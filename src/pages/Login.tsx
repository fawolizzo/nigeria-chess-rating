
import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearAllData } from "@/utils/storageUtils";
import LoginSystemDiagnostic from "@/components/LoginSystemDiagnostic";
import { AlertTriangle, RefreshCw, Loader2 } from "lucide-react";
import { sendSyncEvent } from "@/utils/storageSync";
import { SyncEventType } from "@/types/userTypes";
import { logMessage, LogLevel } from "@/utils/debugLogger";

const Login = () => {
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  
  const handleSystemReset = async () => {
    setIsResetting(true);
    
    try {
      logMessage(LogLevel.WARNING, 'Login', "User initiated system reset");
      
      toast({
        title: "System Reset",
        description: "Resetting all system data...",
      });
      
      // Broadcast reset event to other devices/tabs
      sendSyncEvent(SyncEventType.RESET);
      sendSyncEvent(SyncEventType.CLEAR_DATA);
      
      // Clear all data
      const success = await clearAllData();
      
      if (success) {
        logMessage(LogLevel.INFO, 'Login', "System reset completed successfully");
        
        toast({
          title: "Reset Complete",
          description: "All data has been cleared successfully. The page will reload now.",
        });
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        logMessage(LogLevel.ERROR, 'Login', "System reset completed with warnings");
        
        toast({
          title: "Reset Issues",
          description: "There may be some issues with the reset. The page will refresh to ensure clean state.",
          variant: "warning",
        });
        
        // Force reload even if there were issues
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error("[Login] Reset failed:", error);
      logMessage(LogLevel.ERROR, 'Login', "Reset failed with error:", error);
      
      toast({
        title: "Reset Failed",
        description: "Failed to reset data. Please refresh the page and try again.",
        variant: "destructive",
      });
      
      // Still try to reload
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } finally {
      setIsResetting(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      
      <div className="max-w-7xl mx-auto pt-24 sm:pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
          <LoginForm />
          
          <div className="px-6 pb-6 text-center text-sm">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Don't have an account?{" "}
              <Link to="/register" className="text-nigeria-green dark:text-nigeria-green-light font-medium hover:underline">
                Register
              </Link>
            </p>
            
            <div className="mt-6 border-t pt-6 border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-center mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Having login issues? Try resetting the system data
                </p>
              </div>
              
              <div className="flex justify-center mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSystemReset}
                  disabled={isResetting}
                  className="text-xs flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Reset All Data
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Display the diagnostic component only in development mode */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 max-w-md mx-auto">
            <LoginSystemDiagnostic />
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
