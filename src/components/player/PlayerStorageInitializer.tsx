
import { useEffect, useRef } from "react";
import { initializeStorageListeners, forceSyncAllStorage } from "@/utils/storageUtils";
import { useToast } from "@/components/ui/use-toast";

/**
 * Component to initialize storage listeners on mount and ensure data is synchronized
 */
const PlayerStorageInitializer: React.FC = () => {
  const syncIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();
  const initializedRef = useRef(false);
  const errorCountRef = useRef(0);
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting, initializing storage");
    
    if (!initializedRef.current) {
      try {
        // Test storage availability first
        try {
          localStorage.setItem('storage_test', 'test');
          localStorage.removeItem('storage_test');
          
          sessionStorage.setItem('storage_test', 'test');
          sessionStorage.removeItem('storage_test');
          
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
        
        // Initialize listeners for storage events
        initializeStorageListeners();
        
        // Force initial sync of all storage
        forceSyncAllStorage();
        
        console.log("[PlayerStorageInitializer] Storage initialized successfully");
        initializedRef.current = true;
        
        // Confirmation toast
        toast({
          title: "Data Initialized",
          description: "Player data has been loaded successfully.",
        });
      } catch (error) {
        console.error("[PlayerStorageInitializer] Error initializing storage:", error);
        toast({
          title: "Storage Error",
          description: "There was a problem initializing local data storage. Some features may not work correctly.",
          variant: "destructive",
        });
      }
    }
    
    // Set up interval to periodically force sync storage while viewing player profiles
    syncIntervalRef.current = window.setInterval(() => {
      console.log("[PlayerStorageInitializer] Performing periodic storage sync");
      try {
        forceSyncAllStorage();
        // Reset error count on successful sync
        errorCountRef.current = 0;
      } catch (error) {
        console.error("[PlayerStorageInitializer] Error during periodic sync:", error);
        errorCountRef.current += 1;
        
        // If we've had multiple consecutive errors, show a warning
        if (errorCountRef.current >= 3) {
          toast({
            title: "Storage Sync Issues",
            description: "Having trouble keeping data in sync. Consider refreshing the page.",
            variant: "warning",
          });
          // Reset counter after showing warning
          errorCountRef.current = 0;
        }
      }
    }, 10000); // Check every 10 seconds
    
    // Add a listener for focus events to sync when the tab regains focus
    const handleFocus = () => {
      console.log("[PlayerStorageInitializer] Window focus event, syncing storage");
      try {
        forceSyncAllStorage();
      } catch (error) {
        console.error("[PlayerStorageInitializer] Error during focus sync:", error);
      }
    };
    
    // Add a listener for online events to sync when connection is restored
    const handleOnline = () => {
      console.log("[PlayerStorageInitializer] Device came online, syncing storage");
      try {
        forceSyncAllStorage();
        toast({
          title: "Connection Restored",
          description: "You're back online. Data has been synchronized.",
        });
      } catch (error) {
        console.error("[PlayerStorageInitializer] Error during online sync:", error);
      }
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    
    return () => {
      console.log("[PlayerStorageInitializer] Cleaning up storage listener and intervals");
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
    };
  }, [toast]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
