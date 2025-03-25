
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
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting, initializing storage");
    
    if (!initializedRef.current) {
      try {
        // Initialize listeners for storage events
        initializeStorageListeners();
        
        // Force initial sync of all storage
        forceSyncAllStorage();
        
        console.log("[PlayerStorageInitializer] Storage initialized successfully");
        initializedRef.current = true;
      } catch (error) {
        console.error("[PlayerStorageInitializer] Error initializing storage:", error);
        toast({
          title: "Storage Error",
          description: "There was a problem initializing local data storage.",
          variant: "destructive",
        });
      }
    }
    
    // Set up interval to periodically force sync storage while viewing player profiles
    syncIntervalRef.current = window.setInterval(() => {
      console.log("[PlayerStorageInitializer] Performing periodic storage sync");
      try {
        forceSyncAllStorage();
      } catch (error) {
        console.error("[PlayerStorageInitializer] Error during periodic sync:", error);
      }
    }, 15000); // Check every 15 seconds
    
    // Add a listener for focus events to sync when the tab regains focus
    const handleFocus = () => {
      console.log("[PlayerStorageInitializer] Window focus event, syncing storage");
      forceSyncAllStorage();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      console.log("[PlayerStorageInitializer] Cleaning up storage listener and intervals");
      if (syncIntervalRef.current !== null) {
        clearInterval(syncIntervalRef.current);
      }
      window.removeEventListener('focus', handleFocus);
    };
  }, [toast]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
