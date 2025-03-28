
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import LoginForm from "@/components/LoginForm";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { clearAllData } from "@/utils/storageUtils";

const Login = () => {
  const { toast } = useToast();
  
  const handleSystemReset = async () => {
    toast({
      title: "System Reset",
      description: "Resetting all system data...",
    });
    
    try {
      const success = await clearAllData();
      
      if (success) {
        toast({
          title: "Reset Complete",
          description: "All data has been cleared successfully",
        });
        
        // Reload the page
        window.location.reload();
      } else {
        toast({
          title: "Reset Issues",
          description: "There may be some issues with the reset. Try refreshing the page.",
          variant: "warning",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset data. Please refresh the page and try again.",
        variant: "destructive",
      });
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
            
            <div className="flex justify-center mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSystemReset}
                className="text-xs flex items-center gap-1 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
              >
                Reset All Data
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
