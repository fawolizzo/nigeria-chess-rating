
import React from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface ResetSystemDataProps {
  onReset?: () => void;
}

const ResetSystemData: React.FC<ResetSystemDataProps> = ({ onReset }) => {
  const { toast } = useToast();

  const handleResetSystem = () => {
    if (window.confirm("Are you sure you want to reset all system data? This will remove all users, players, and tournaments. This action cannot be undone.")) {
      // Clear all data from localStorage
      localStorage.removeItem('users');
      localStorage.removeItem('players');
      localStorage.removeItem('tournaments');
      localStorage.removeItem('currentUser');
      
      toast({
        title: "System Reset Successful",
        description: "All data has been cleared. You will need to log out and create new accounts.",
        variant: "default",
      });
      
      if (onReset) {
        onReset();
      }
      
      // Redirect to homepage after a brief delay
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  return (
    <div className="p-4 border border-red-300 bg-red-50 dark:bg-red-900/20 rounded-md">
      <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">System Reset</h3>
      <p className="text-sm text-red-600 dark:text-red-300 mb-4">
        This will remove all users, players, tournaments, and registration data from the system.
        You will need to register new users after this action.
      </p>
      <Button 
        variant="destructive" 
        onClick={handleResetSystem}
        className="w-full"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Reset System Data
      </Button>
    </div>
  );
};

export default ResetSystemData;
