
import { useEffect } from "react";
import { initializeStorageListeners, forceSyncAllStorage } from "@/utils/storageUtils";

/**
 * Component to initialize storage listeners on mount and ensure data is synchronized
 */
const PlayerStorageInitializer: React.FC = () => {
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Initializing storage listeners and syncing data");
    
    // Initialize listeners for storage events
    initializeStorageListeners();
    
    // Force sync all storage to ensure we have the latest data
    forceSyncAllStorage();
    
    // Set up interval to periodically force sync storage while viewing player profiles
    const intervalId = setInterval(() => {
      console.log("[PlayerStorageInitializer] Performing periodic storage sync");
      forceSyncAllStorage();
    }, 15000); // Check every 15 seconds
    
    return () => {
      console.log("[PlayerStorageInitializer] Cleaning up storage listener and intervals");
      clearInterval(intervalId);
    };
  }, []);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
