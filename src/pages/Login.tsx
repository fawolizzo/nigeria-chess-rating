
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/LoginForm";
import { PlayerStorageInitializer } from "@/components";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { forceSyncAllStorage } from "@/utils/storageUtils";

const Login = () => {
  const { toast } = useToast();
  
  const handleForceSync = async () => {
    toast({
      title: "Syncing...",
      description: "Attempting to sync data across devices",
    });
    
    try {
      const success = await forceSyncAllStorage();
      if (success) {
        toast({
          title: "Sync Complete",
          description: "Data has been synchronized successfully",
        });
      } else {
        toast({
          title: "Sync Issues",
          description: "There may be some issues with syncing. Try refreshing the page.",
          variant: "warning",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: "Failed to sync data. Please refresh the page and try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <PlayerStorageInitializer />
      
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
            
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceSync}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <RefreshCw size={12} className="mr-1" />
                Sync Devices
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
