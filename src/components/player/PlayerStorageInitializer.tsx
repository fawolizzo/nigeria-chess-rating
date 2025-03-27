
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { forceSyncAllStorage, checkStorageHealth } from "@/utils/storageUtils";
import { checkResetStatus, clearResetStatus, processSystemReset } from "@/utils/storageSync";

/**
 * Component to initialize storage and handle sync events on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  
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
      
      // Force sync storage
      const syncStorage = async () => {
        try {
          const success = await forceSyncAllStorage();
          if (!success) {
            console.warn("[PlayerStorageInitializer] Storage sync issues detected");
            toast({
              title: "Sync Warning",
              description: "There were issues syncing your data. Some features may not work correctly.",
              variant: "warning",
            });
          } else {
            console.log("[PlayerStorageInitializer] Storage synced successfully");
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
      
      // Add a listener for online events to sync when connection is restored
      const handleOnline = () => {
        console.log("[PlayerStorageInitializer] Device came online");
        toast({
          title: "Connection Restored",
          description: "You're back online. Synchronizing data...",
        });
        // Need to properly handle the async function here too
        syncStorage();
      };
      
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
        }
      };
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('storage', handleStorageEvent);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('storage', handleStorageEvent);
      };
    } catch (error) {
      console.error("[PlayerStorageInitializer] Error initializing storage:", error);
      toast({
        title: "Initialization Error",
        description: "There was a problem initializing the application. Please refresh the page.",
        variant: "destructive",
      });
    }
    
    return () => {
      console.log("[PlayerStorageInitializer] Component unmounting");
    };
  }, [toast]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
