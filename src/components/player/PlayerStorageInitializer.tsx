
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { forceSyncAllStorage, checkStorageHealth } from "@/utils/storageUtils";
import { checkResetStatus, clearResetStatus } from "@/utils/storageSync";

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
        console.log("[PlayerStorageInitializer] System reset detected, clearing reset status");
        clearResetStatus();
        toast({
          title: "System Reset Detected",
          description: "The system has been reset. All account data has been cleared.",
        });
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
      
      // Force sync storage - fixing the Promise approach
      const syncStorage = async () => {
        try {
          const success = await forceSyncAllStorage();
          if (!success) {
            console.warn("[PlayerStorageInitializer] Storage sync issues detected");
          } else {
            console.log("[PlayerStorageInitializer] Storage synced successfully");
          }
        } catch (error) {
          console.error("[PlayerStorageInitializer] Storage sync error:", error);
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
          description: "You're back online.",
        });
        // Need to properly handle the async function here too
        forceSyncAllStorage().catch(error => {
          console.error("[PlayerStorageInitializer] Error syncing after coming online:", error);
        });
      };
      
      window.addEventListener('online', handleOnline);
      
      return () => {
        window.removeEventListener('online', handleOnline);
      };
    } catch (error) {
      console.error("[PlayerStorageInitializer] Error initializing storage:", error);
    }
    
    return () => {
      console.log("[PlayerStorageInitializer] Component unmounting");
    };
  }, [toast]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
