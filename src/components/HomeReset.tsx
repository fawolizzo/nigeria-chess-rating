
import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const HomeReset: React.FC = () => {
  const { toast } = useToast();

  const handleResetSystem = () => {
    if (window.confirm("Are you sure you want to reset all system data? This will remove all users, players, and tournaments. This action cannot be undone.")) {
      // Clear all data from localStorage
      localStorage.clear();
      
      toast({
        title: "System Reset Successful",
        description: "All data has been cleared. The page will now reload.",
        variant: "default",
      });
      
      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1500);
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
