
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
import { performSystemReset } from "@/utils/storageSync";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/services/auth/useSupabaseAuth";
import { logMessage, LogLevel } from "@/utils/debugLogger";
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
  const { clearAllData: clearUserData } = useUser();
  const { user } = useSupabaseAuth();
  const [isResetting, setIsResetting] = useState(false);
  const [resetStep, setResetStep] = useState<'idle' | 'confirming' | 'processing' | 'success' | 'error'>('idle');

  const handleResetSystem = async () => {
    try {
      setIsResetting(true);
      setResetStep('processing');
      console.log("[HomeReset] Starting complete system reset...");
      logMessage(LogLevel.WARNING, 'HomeReset', "User initiated system reset");
      
      toast({
        title: "System Reset Started",
        description: "Clearing all data, this will log you out. Please wait...",
        duration: 5000,
      });
      
      // Store the current user's email if available (for potential deletion)
      const currentUserEmail = user?.email;
      
      // Step 1: Sign out from Supabase
      await supabase.auth.signOut();
      console.log("[HomeReset] Signed out from Supabase Auth");
      
      // Step 2: Clear local data
      await clearUserData();
      console.log("[HomeReset] Local data cleared");
      
      // Step 3: Trigger global reset
      await performSystemReset();
      console.log("[HomeReset] Global reset triggered");
      
      // Step 4: If we have the current user's email and it's a test account, attempt to delete it
      if (currentUserEmail && 
         (currentUserEmail.includes('test') || 
          currentUserEmail.includes('demo') || 
          confirm(`Delete the Supabase auth user "${currentUserEmail}" to allow reuse for testing?`))) {
        
        console.log(`[HomeReset] Attempting to delete Supabase auth user: ${currentUserEmail}`);
        
        try {
          // Call the edge function to delete the user
          const { data, error } = await supabase.functions.invoke('delete-auth-user', {
            body: { email: currentUserEmail }
          });
          
          if (error) {
            console.error("[HomeReset] Error deleting auth user:", error);
            logMessage(LogLevel.ERROR, 'HomeReset', "Error deleting auth user", error);
          } else {
            console.log("[HomeReset] Auth user deletion response:", data);
            if (data.success) {
              console.log(`[HomeReset] Auth user with email ${currentUserEmail} deleted successfully`);
              logMessage(LogLevel.INFO, 'HomeReset', `Auth user deleted: ${currentUserEmail}`);
            }
          }
        } catch (fnError) {
          console.error("[HomeReset] Edge function error:", fnError);
          logMessage(LogLevel.ERROR, 'HomeReset', "Edge function error when deleting user", fnError);
        }
      }
      
      // Set success state
      setResetStep('success');
      
      // Show success toast
      toast({
        title: "Reset Successful",
        description: "All system data has been cleared. The page will reload.",
        duration: 5000,
      });
      
      // Delay reload to allow toast to be seen
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      console.error("[HomeReset] Error during system reset:", error);
      logMessage(LogLevel.ERROR, 'HomeReset', "Error during system reset", error);
      
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
            {resetStep === 'processing' ? "Resetting System..." : 
             resetStep === 'success' ? "Reset Successful" : 
             resetStep === 'error' ? "Reset Failed" : 
             "Reset System Data"}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center text-red-600">
              <ShieldAlert className="h-5 w-5 mr-2" />
              Confirm System Reset
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              <p className="mb-4 font-medium">
                This will:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Clear all local data</li>
                <li>Log you out of your account</li>
                <li>Reset any unsaved changes</li>
              </ul>
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">
                      {user?.email ? `Current user: ${user.email}` : 'No user is currently logged in'}
                    </p>
                    <p className="mt-1">
                      {user?.email ? 
                        "For test accounts, this will attempt to delete the Supabase auth user to allow re-registration with the same email." : 
                        "Note: No user is currently logged in to delete from Supabase."
                      }
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
              Reset System
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <p className="text-xs text-gray-500 mt-2">
        This will sign you out and clear local data. {user?.email ? "For test accounts, this will also attempt to delete the Supabase auth user." : ""}
      </p>
    </div>
  );
};

export default HomeReset;
