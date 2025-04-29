
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import { ensureDeviceId } from "@/utils/deviceSync";

/**
 * Hook for initializing storage with proper error handling
 */
export const useStorageInitialization = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const { refreshUserData, clearAllData, forceSync } = useUser();
  const syncInProgressRef = useRef(false);

  const isProduction = import.meta.env.PROD;
  
  /**
   * Initialize the device storage and attempt synchronization
   */
  const initialize = async () => {
    try {
      // Test storage access
      localStorage.setItem('storage_test', 'test');
      localStorage.removeItem('storage_test');
      console.log("[StorageInitialization] Storage access test successful");
    } catch (storageError) {
      console.error("[StorageInitialization] Storage access test failed:", storageError);
      
      if (!isProduction) {
        toast({
          title: "Storage Access Error",
          description: "Your browser may be blocking access to local storage. Try disabling private browsing or clearing cookies.",
          variant: "destructive",
        });
      }
      
      throw new Error("Storage access failed");
    }
    
    // Ensure device has an ID
    const deviceId = ensureDeviceId();
    console.log(`[StorageInitialization] Device ID: ${deviceId}`);
    
    // Attempt sync with increasing attempts
    const maxSyncAttempts = isProduction ? 1 : 2;
    let syncSuccessful = false;
    
    for (let attempt = 1; attempt <= maxSyncAttempts; attempt++) {
      setSyncAttempts(attempt);
      console.log(`[StorageInitialization] Sync attempt ${attempt}/${maxSyncAttempts}`);
      
      try {
        await new Promise(resolve => setTimeout(resolve, isProduction ? 300 : 500));
        const syncResult = await forceSync();
        
        if (syncResult) {
          console.log("[StorageInitialization] Sync successful on attempt", attempt);
          syncSuccessful = true;
          break;
        } else {
          console.warn(`[StorageInitialization] Sync attempt ${attempt} unsuccessful`);
        }
      } catch (syncError) {
        console.error(`[StorageInitialization] Sync attempt ${attempt} error:`, syncError);
      }
    }
    
    if (!syncSuccessful && syncAttempts >= maxSyncAttempts) {
      console.warn("[StorageInitialization] Max sync attempts reached, continuing with local data");
    }
    
    await refreshUserData();
    console.log("[StorageInitialization] Initialization complete");
    setIsInitialized(true);
  };

  return {
    initialize,
    isInitialized,
    syncAttempts,
    syncInProgressRef,
    isProduction
  };
};
