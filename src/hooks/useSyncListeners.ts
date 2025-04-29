
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEY_CURRENT_USER, STORAGE_KEY_USERS } from "@/types/userTypes";
import { setupSyncListeners } from "@/utils/deviceSync";
import { saveDataToStorage } from "@/utils/deviceSync";

/**
 * Hook for setting up sync listeners across tabs/devices
 */
export const useSyncListeners = (
  syncInProgressRef: React.MutableRefObject<boolean>,
  refreshUserData: () => Promise<boolean>,
  isProduction: boolean
) => {
  const { toast } = useToast();

  useEffect(() => {
    const cleanup = setupSyncListeners(
      // Reset handler
      () => {
        console.log("[SyncListeners] Reset event received");
        
        if (!isProduction) {
          toast({
            title: "System Reset Detected",
            description: "The system has been reset from another device. The page will reload.",
            duration: 3000,
          });
        }
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      
      // Sync handler
      async (data) => {
        if (syncInProgressRef.current) {
          console.log("[SyncListeners] Sync already in progress, deferring new sync event");
          return;
        }
        
        syncInProgressRef.current = true;
        
        try {
          console.log(`[SyncListeners] Sync event received`, data);
          
          if (data && data.key) {
            console.log(`[SyncListeners] Syncing key: ${data.key}`);
            saveDataToStorage(data.key, data.data);
          }
          
          await refreshUserData();
          console.log("[SyncListeners] User data refreshed after sync event");
        } finally {
          syncInProgressRef.current = false;
        }
      },
      
      // Login handler
      async (userData) => {
        console.log("[SyncListeners] Login event received", userData?.email || "unknown user");
        
        if (userData) {
          saveDataToStorage(STORAGE_KEY_CURRENT_USER, userData);
          console.log("[SyncListeners] User data saved from login event");
        }
        
        await refreshUserData();
        
        if (!isProduction) {
          toast({
            title: "Login Detected",
            description: "Your account has been logged in from another device.",
          });
        }
      },
      
      // Logout handler
      () => {
        console.log("[SyncListeners] Logout event received");
        
        if (!isProduction) {
          toast({
            title: "Logged Out",
            description: "You have been logged out from another device.",
          });
        }
        
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
        console.log("[SyncListeners] User data cleared after logout event");
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      },
      
      // Approval handler
      async (userId) => {
        console.log("[SyncListeners] Approval event received for:", userId);
        
        if (!isProduction) {
          toast({
            title: "Account Status Updated",
            description: "Your account status has been updated. The page will refresh to apply changes.",
            duration: 4000,
          });
        }
        
        await refreshUserData();
        console.log("[SyncListeners] User data refreshed after approval event");
        
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    );
    
    return cleanup;
  }, [toast, refreshUserData, syncInProgressRef, isProduction]);
};
