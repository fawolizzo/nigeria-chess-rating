
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { forceSyncAllStorage, checkStorageHealth } from "@/utils/storageUtils";
import { 
  checkResetStatus, 
  clearResetStatus, 
  processSystemReset, 
  forceGlobalSync,
  listenForSyncEvents,
  SyncEventType,
  sendSyncEvent
} from "@/utils/storageSync";
import { STORAGE_KEY_CURRENT_USER, STORAGE_KEY_USERS } from "@/types/userTypes";

/**
 * Component to initialize storage and handle sync events on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting");
    
    try {
      // Check for system reset
      if (checkResetStatus()) {
        console.log("[PlayerStorageInitializer] System reset detected, processing reset");
        // Clear reset status first to prevent loops
        clearResetStatus();
        // Show toast
        toast({
          title: "System Reset Detected",
          description: "The system has been reset. All account data has been cleared.",
        });
        // Process the reset
        processSystemReset();
        return; // Early return to prevent other initializations
      }
      
      // Test storage availability
      try {
        localStorage.setItem('storage_test', 'test');
        localStorage.removeItem('storage_test');
        console.log("[PlayerStorageInitializer] Storage access test successful");
      } catch (storageError) {
        console.error("[PlayerStorageInitializer] Storage access test failed:", storageError);
        toast({
          title: "Storage Access Error",
          description: "Your browser may be blocking access to local storage. Try disabling private browsing or clearing cookies.",
          variant: "destructive",
        });
        throw new Error("Storage access failed");
      }
      
      // Force sync storage with critical auth data prioritized
      const syncStorage = async () => {
        try {
          // First sync critical auth data
          const authSyncSuccess = await forceSyncAllStorage([STORAGE_KEY_CURRENT_USER, STORAGE_KEY_USERS]);
          
          // Then sync everything else
          const fullSyncSuccess = await forceSyncAllStorage();
          
          if (!authSyncSuccess || !fullSyncSuccess) {
            console.warn("[PlayerStorageInitializer] Storage sync issues detected");
            toast({
              title: "Sync Warning",
              description: "There were issues syncing your data. Some features may not work correctly.",
              variant: "warning",
            });
          } else {
            console.log("[PlayerStorageInitializer] Storage synced successfully");
            
            // Notify other devices to also sync their data
            sendSyncEvent(SyncEventType.FORCE_SYNC);
          }
        } catch (error) {
          console.error("[PlayerStorageInitializer] Storage sync error:", error);
          toast({
            title: "Sync Error",
            description: "Failed to synchronize data. Please reload the page.",
            variant: "destructive",
          });
        }
      };
      
      syncStorage();
      
      // Check storage health
      checkStorageHealth();
      
      // Listen for sync events from other devices/tabs
      const cleanupListener = listenForSyncEvents(
        // Reset handler
        () => {
          console.log("[PlayerStorageInitializer] Reset event received");
          toast({
            title: "System Reset Detected",
            description: "The system has been reset from another device. The page will reload.",
            duration: 3000,
          });
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        // Update handler
        async (key, data) => {
          console.log(`[PlayerStorageInitializer] Update event received for ${key}`);
          if (key === STORAGE_KEY_USERS || key === STORAGE_KEY_CURRENT_USER) {
            // If it's a critical auth update, sync immediately
            await syncStorage();
          }
        },
        // Logout handler
        () => {
          console.log("[PlayerStorageInitializer] Logout event received");
          toast({
            title: "Logged Out",
            description: "You have been logged out from another device.",
          });
          
          // Remove current user data
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          
          // Reload the page to reset the app state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        // Login handler
        (userData) => {
          console.log("[PlayerStorageInitializer] Login event received");
          toast({
            title: "Login Detected",
            description: "Your account has been logged in from another device.",
          });
          
          // Sync storage to get the latest user data
          syncStorage();
        },
        // Approval handler
        (userId) => {
          console.log("[PlayerStorageInitializer] Approval event received");
          toast({
            title: "Account Status Updated",
            description: "Your account status has been updated. Please refresh the page.",
          });
          
          // Sync storage to get the latest user data
          syncStorage();
        },
        // Force sync handler
        async () => {
          console.log("[PlayerStorageInitializer] Force sync event received");
          await syncStorage();
        }
      );
      
      // Add a listener for online events to sync when connection is restored
      const handleOnline = () => {
        console.log("[PlayerStorageInitializer] Device came online");
        toast({
          title: "Connection Restored",
          description: "You're back online. Synchronizing data...",
        });
        syncStorage();
      };
      
      window.addEventListener('online', handleOnline);
      
      // Add a listener for storage events related to resets
      const handleStorageEvent = (event: StorageEvent) => {
        if (event.key === 'ncr_system_reset' && event.newValue) {
          console.log("[PlayerStorageInitializer] Reset event detected via storage");
          toast({
            title: "System Reset",
            description: "The system has been reset from another device. The page will reload.",
            duration: 3000,
          });
          
          // Reload after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (event.key === 'ncr_force_sync') {
          console.log("[PlayerStorageInitializer] Force sync event detected");
          syncStorage();
        } else if (event.key === STORAGE_KEY_USERS || event.key === STORAGE_KEY_CURRENT_USER) {
          console.log(`[PlayerStorageInitializer] Auth data updated: ${event.key}`);
          // If critical auth data changes, sync immediately
          syncStorage();
        }
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('storage', handleStorageEvent);
      
      setIsInitialized(true);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('storage', handleStorageEvent);
        cleanupListener();
        console.log("[PlayerStorageInitializer] Component unmounting");
      };
    } catch (error) {
      console.error("[PlayerStorageInitializer] Error initializing storage:", error);
      toast({
        title: "Initialization Error",
        description: "There was a problem initializing the application. Please refresh the page.",
        variant: "destructive",
      });
      setIsInitialized(true);
    }
  }, [toast]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
