import { useEffect, useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEY_CURRENT_USER, STORAGE_KEY_USERS, SyncEventType } from "@/types/userTypes";
import {
  setupSyncListeners,
  requestDataSync,
  getDataFromStorage,
  saveDataToStorage,
  ensureDeviceId
} from "@/utils/deviceSync";
import { useUser } from "@/contexts/UserContext";
import { useProductionSync } from "@/hooks/useProductionSync";

/**
 * Component to initialize storage and handle sync events on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const { refreshUserData, clearAllData, forceSync } = useUser();
  const syncInProgressRef = useRef(false);

  const isProduction = import.meta.env.PROD;
  
  useProductionSync();
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting");
    
    try {
      window.ncrForceSyncFunction = async (keys?: string[]) => {
        console.log("[PlayerStorageInitializer] Global force sync triggered", keys);
        
        if (syncInProgressRef.current) {
          console.log("[PlayerStorageInitializer] Sync already in progress, skipping");
          return false;
        }
        
        syncInProgressRef.current = true;
        
        try {
          if (keys && keys.length > 0) {
            console.log(`[PlayerStorageInitializer] Syncing specific keys: ${keys.join(', ')}`);
            const result = await refreshUserData();
            return result;
          } else {
            console.log("[PlayerStorageInitializer] Performing full data sync");
            const result = await forceSync();
            return result;
          }
        } catch (error) {
          console.error("[PlayerStorageInitializer] Force sync error:", error);
          return false;
        } finally {
          syncInProgressRef.current = false;
        }
      };
      
      window.ncrClearAllData = async () => {
        console.log("[PlayerStorageInitializer] Global clear data triggered");
        return await clearAllData();
      };
      
      const deviceId = ensureDeviceId();
      console.log(`[PlayerStorageInitializer] Device ID: ${deviceId}`);
      
      const initialize = async () => {
        try {
          localStorage.setItem('storage_test', 'test');
          localStorage.removeItem('storage_test');
          console.log("[PlayerStorageInitializer] Storage access test successful");
        } catch (storageError) {
          console.error("[PlayerStorageInitializer] Storage access test failed:", storageError);
          
          if (!isProduction) {
            toast({
              title: "Storage Access Error",
              description: "Your browser may be blocking access to local storage. Try disabling private browsing or clearing cookies.",
              variant: "destructive",
            });
          }
          
          throw new Error("Storage access failed");
        }
        
        const maxSyncAttempts = isProduction ? 1 : 2;
        let syncSuccessful = false;
        
        for (let attempt = 1; attempt <= maxSyncAttempts; attempt++) {
          setSyncAttempts(attempt);
          console.log(`[PlayerStorageInitializer] Sync attempt ${attempt}/${maxSyncAttempts}`);
          
          try {
            requestDataSync();
            await new Promise(resolve => setTimeout(resolve, isProduction ? 300 : 500));
            const syncResult = await forceSync();
            
            if (syncResult) {
              console.log("[PlayerStorageInitializer] Sync successful on attempt", attempt);
              syncSuccessful = true;
              break;
            } else {
              console.warn(`[PlayerStorageInitializer] Sync attempt ${attempt} unsuccessful`);
            }
          } catch (syncError) {
            console.error(`[PlayerStorageInitializer] Sync attempt ${attempt} error:`, syncError);
          }
        }
        
        if (!syncSuccessful && syncAttempts >= maxSyncAttempts) {
          console.warn("[PlayerStorageInitializer] Max sync attempts reached, continuing with local data");
        }
        
        await refreshUserData();
        console.log("[PlayerStorageInitializer] Initialization complete");
      };
      
      setTimeout(() => {
        initialize().then(() => {
          setIsInitialized(true);
        }).catch(error => {
          console.error("[PlayerStorageInitializer] Initialization error:", error);
          
          if (!isProduction) {
            toast({
              title: "Initialization Error",
              description: "There was a problem initializing the application. Please refresh the page or try again later.",
              variant: "destructive",
              duration: 5000,
            });
          }
          
          setIsInitialized(true);
        });
      }, 100);
      
      const cleanup = setupSyncListeners(
        () => {
          console.log("[PlayerStorageInitializer] Reset event received");
          
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
        async (data) => {
          if (syncInProgressRef.current) {
            console.log("[PlayerStorageInitializer] Sync already in progress, deferring new sync event");
            return;
          }
          
          syncInProgressRef.current = true;
          
          try {
            console.log(`[PlayerStorageInitializer] Sync event received`, data);
            
            if (data && data.key) {
              console.log(`[PlayerStorageInitializer] Syncing key: ${data.key}`);
              saveDataToStorage(data.key, data.data);
            }
            
            await refreshUserData();
            console.log("[PlayerStorageInitializer] User data refreshed after sync event");
          } finally {
            syncInProgressRef.current = false;
          }
        },
        async (userData) => {
          console.log("[PlayerStorageInitializer] Login event received", userData?.email || "unknown user");
          
          if (userData) {
            saveDataToStorage(STORAGE_KEY_CURRENT_USER, userData);
            console.log("[PlayerStorageInitializer] User data saved from login event");
          }
          
          await refreshUserData();
          
          if (!isProduction) {
            toast({
              title: "Login Detected",
              description: "Your account has been logged in from another device.",
            });
          }
        },
        () => {
          console.log("[PlayerStorageInitializer] Logout event received");
          
          if (!isProduction) {
            toast({
              title: "Logged Out",
              description: "You have been logged out from another device.",
            });
          }
          
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          console.log("[PlayerStorageInitializer] User data cleared after logout event");
          
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        async (userId) => {
          console.log("[PlayerStorageInitializer] Approval event received for:", userId);
          
          if (!isProduction) {
            toast({
              title: "Account Status Updated",
              description: "Your account status has been updated. The page will refresh to apply changes.",
              duration: 4000,
            });
          }
          
          await refreshUserData();
          console.log("[PlayerStorageInitializer] User data refreshed after approval event");
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      );
      
      return () => {
        delete window.ncrForceSyncFunction;
        delete window.ncrClearAllData;
        window.ncrIsResetting = false;
        
        cleanup();
        console.log("[PlayerStorageInitializer] Component unmounting");
      };
    } catch (error) {
      console.error("[PlayerStorageInitializer] Error initializing storage:", error);
      
      if (!isProduction) {
        toast({
          title: "Initialization Error",
          description: "There was a problem initializing the application. Please refresh the page.",
          variant: "destructive",
        });
      }
      
      setIsInitialized(true);
    }
  }, [toast, refreshUserData, clearAllData, forceSync, isProduction]);

  return null;
};

export default PlayerStorageInitializer;
