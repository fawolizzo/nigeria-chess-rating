
import React, { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ResetSystemDataProps {
  onReset?: () => void;
}

const ResetSystemData: React.FC<ResetSystemDataProps> = ({ onReset }) => {
  const { toast } = useToast();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleResetSystem = () => {
    // Clear all data from localStorage
    localStorage.clear();
    
    toast({
      title: "System Reset Successful",
      description: "All data has been cleared including registered users, players, and tournaments. You can now register again.",
      variant: "default",
    });
    
    if (onReset) {
      onReset();
    }
    
    // Redirect to homepage after a brief delay
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);
  };

  return (
    <div className="p-6 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800/30 rounded-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
            System Reset
          </h3>
          <p className="text-sm text-red-600 dark:text-red-300 mb-4">
            This action will remove all users, players, tournaments, organizers and registration data from the system.
            You will need to register new users after this action.
          </p>
          <Button 
            variant="outline" 
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/30"
            onClick={() => setIsConfirmOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Reset System Data
          </Button>
        </div>
      </div>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm System Reset
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data including users, players, tournaments, and organizers will be permanently deleted. 
              After this action, you will need to register again to use the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              onClick={handleResetSystem}
            >
              Yes, Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ResetSystemData;
