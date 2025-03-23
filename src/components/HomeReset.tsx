
import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HomeReset: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetSystem = () => {
    if (window.confirm("Are you sure you want to reset all system data? This will remove all users, players, and tournaments. This action cannot be undone.")) {
      try {
        console.log("Starting complete system reset...");
        
        // Get all keys in localStorage
        const localStorageKeys = Object.keys(localStorage);
        console.log("Local storage keys before reset:", localStorageKeys);
        
        // Get all keys in sessionStorage
        const sessionStorageKeys = Object.keys(sessionStorage);
        console.log("Session storage keys before reset:", sessionStorageKeys);
        
        // Clear literally everything from localStorage and sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        console.log("Storage cleared successfully");
        
        toast({
          title: "System Reset Successful",
          description: "All data has been completely cleared. The page will now reload.",
          variant: "default",
        });
        
        // Refresh the page after a short delay to allow the toast to be seen
        setTimeout(() => {
          console.log("Reloading page after reset...");
          navigate("/");
          window.location.reload();
        }, 1500);
      } catch (error) {
        console.error("Error during system reset:", error);
        toast({
          title: "Reset Failed",
          description: "An error occurred during the reset. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="mt-8 text-center">
      <Button 
        variant="outline" 
        onClick={handleResetSystem}
        className="bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Reset System Data
      </Button>
      <p className="text-xs text-gray-500 mt-2">
        This will clear all data and allow you to start fresh.
      </p>
    </div>
  );
};

export default HomeReset;
