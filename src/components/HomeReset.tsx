
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle, 
  X 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { performSystemReset } from "@/utils/storageSync";
import { clearAllData } from "@/utils/storageUtils";
import { useUser } from "@/contexts/UserContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const HomeReset: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { clearAllData: clearUserData } = useUser();
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<'idle' | 'confirming' | 'processing' | 'success' | 'error'>('idle');

  const handleResetSystem = async () => {
    try {
      setIsResetting(true);
      setResetStep('processing');
      console.log("[HomeReset] Starting complete system reset...");
      
      toast({
        title: "System Reset Started",
        description: "Clearing all data across devices. Please wait...",
        duration: 5000,
      });
      
      // First, clear local data
      const localClearResult = await clearUserData();
      
      if (!localClearResult) {
        throw new Error("Failed to clear local data");
      }
      
      // Then trigger global reset
      performSystemReset();
      
      // Set success state
      setResetStep('success');
      
      // Show success toast
      toast({
        title: "Reset Successful",
        description: "All system data has been cleared across all devices.",
        duration: 5000,
      });
      
      // Delay reload to allow toast to be seen
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("[HomeReset] Error during system reset:", error);
      
      setResetStep('error');
      
      toast({
        title: "Reset Failed",
        description: "An error occurred during the reset. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      
      // Reset state after error
      setTimeout(() => {
        setIsResetting(false);
        setResetStep('idle');
      }, 3000);
    }
  };

  return (
    <div className="mt-8 text-center">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button 
            variant="outline" 
            className="bg-orange-100 hover:bg-orange-200 text-orange-800 border-orange-300"
            disabled={isResetting}
          >
            {resetStep === 'processing' ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : resetStep === 'success' ? (
              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
            ) : resetStep === 'error' ? (
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
            ) : (
              <ShieldAlert className="h-4 w-4 mr-2" />
            )}
            {resetStep === 'processing' ? "Resetting All Devices..." : 
             resetStep === 'success' ? "Reset Successful" : 
             resetStep === 'error' ? "Reset Failed" : 
             "Reset System Data (All Devices)"}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <ShieldAlert className="h-5 w-5 mr-2" />
              Confirm Complete System Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <p className="mb-4 font-medium">
                This will permanently delete all data from the system across all connected devices:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>All user accounts (tournament organizers and rating officers)</li>
                <li>All player profiles and ratings</li>
                <li>All tournaments and results</li>
                <li>All system settings and preferences</li>
              </ul>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">This action cannot be undone</p>
                    <p className="mt-1">
                      All connected devices will be cleared and any users currently logged in will be logged out.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-between">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleResetSystem}
            >
              Reset All Data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <p className="text-xs text-gray-500 mt-2">
        This will clear all data on all connected devices and allow you to start fresh.
      </p>
    </div>
  );
};

export default HomeReset;
