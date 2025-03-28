
import { useState } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { useUser } from "@/contexts/UserContext";

interface ResetSystemDataProps {
  onReset?: () => void;
}

const ResetSystemData: React.FC<ResetSystemDataProps> = ({ onReset }) => {
  const { clearAllData } = useUser();
  const [isResetting, setIsResetting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);

    try {
      console.log("Starting system data reset...");
      
      // Perform system reset
      const success = await clearAllData();
      
      if (success) {
        console.log("System reset completed successfully");
      } else {
        console.error("System reset completed with errors");
      }
      
      // Call onReset callback if provided
      if (onReset) {
        onReset();
      }
      
      // Reload the page after a small delay to ensure storage events are processed
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Error during system reset:", error);
      setIsResetting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All System Data
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5 mr-2" />
            Reset System Data
          </DialogTitle>
          <DialogDescription>
            This will delete ALL system data including users, tournaments, and player records.
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-300">
          Warning: All data will be permanently deleted across all devices. You will be logged out 
          and redirected to the homepage.
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setIsDialogOpen(false)}
            disabled={isResetting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReset}
            disabled={isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset All Data"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResetSystemData;
