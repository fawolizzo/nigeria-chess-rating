
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
import useProductionSync from "@/hooks/useProductionSync";

/**
 * Component to initialize storage and handle sync events on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const [syncAttempts, setSyncAttempts] = useState(0);
  const { refreshUserData, clearAllData, forceSync } = useUser();
  const syncInProgressRef = useRef(false);

  // Check if in production mode
  const isProduction = import.meta.env.PROD;
  
  // Use production sync hook in production mode
  useProductionSync();
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting");
    
    try {
      // Initialize global functions for cross-device sync
      window.ncrForceSyncFunction = async (keys?: string[]) => {
        console.log("[PlayerStorageInitializer] Global force sync triggered", keys);
        
        // Prevent concurrent syncs
        if (syncInProgressRef.current) {
          console.log("[PlayerStorageInitializer] Sync already in progress, skipping");
          return false;
        }
        
        syncInProgressRef.current = true;
        
        try {
          if (keys && keys.length > 0) {
            console.log(`[PlayerStorageInitializer] Syncing specific keys: ${keys.join(', ')}`);
            // Focused sync for specific keys
            const result = await refreshUserData();
            return result;
          } else {
            // Full sync of all data
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
      
      // Generate unique device ID on initialization if not exists
      const deviceId = ensureDeviceId();
      console.log(`[PlayerStorageInitializer] Device ID: ${deviceId}`);
      
      // Define an initialization function
      const initialize = async () => {
        // Test storage availability
        try {
          localStorage.setItem('storage_test', 'test');
          localStorage.removeItem('storage_test');
          console.log("[PlayerStorageInitializer] Storage access test successful");
        } catch (storageError) {
          console.error("[PlayerStorageInitializer] Storage access test failed:", storageError);
          
          // Only show toast in development
          if (!isProduction) {
            toast({
              title: "Storage Access Error",
              description: "Your browser may be blocking access to local storage. Try disabling private browsing or clearing cookies.",
              variant: "destructive",
            });
          }
          
          throw new Error("Storage access failed");
        }
        
        // Request sync from other devices (with minimal attempts in production)
        const maxSyncAttempts = isProduction ? 1 : 2;
        let syncSuccessful = false;
        
        for (let attempt = 1; attempt <= maxSyncAttempts; attempt++) {
          setSyncAttempts(attempt);
          console.log(`[PlayerStorageInitializer] Sync attempt ${attempt}/${maxSyncAttempts}`);
          
          try {
            // Broadcast sync request to other devices
            requestDataSync();
            
            // Wait for responses with a shorter timeout
            await new Promise(resolve => setTimeout(resolve, isProduction ? 300 : 500));
            
            // Force local sync
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
        
        // Refresh user data regardless of sync result to ensure we have something
        await refreshUserData();
        
        console.log("[PlayerStorageInitializer] Initialization complete");
      };
      
      // Run initialization with timeout to prevent freezing on initial load
      setTimeout(() => {
        initialize().then(() => {
          setIsInitialized(true);
        }).catch(error => {
          console.error("[PlayerStorageInitializer] Initialization error:", error);
          
          // Only show toast in development
          if (!isProduction) {
            toast({
              title: "Initialization Error",
              description: "There was a problem initializing the application. Please refresh the page or try again later.",
              variant: "destructive",
              duration: 5000,
            });
          }
          
          setIsInitialized(true); // Set initialized anyway to allow the app to function
        });
      }, 100);
      
      // Set up sync listeners with enhanced logging
      const cleanup = setupSyncListeners(
        // Reset handler
        () => {
          console.log("[PlayerStorageInitializer] Reset event received");
          
          // Only show toast in development
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
        // Sync handler - prevent rapid consecutive syncs
        async (data) => {
          if (syncInProgressRef.current) {
            console.log("[PlayerStorageInitializer] Sync already in progress, deferring new sync event");
            return;
          }
          
          syncInProgressRef.current = true;
          
          try {
            console.log(`[PlayerStorageInitializer] Sync event received`, data);
            
            if (data && data.key) {
              // Handle data if available
              console.log(`[PlayerStorageInitializer] Syncing key: ${data.key}`);
              saveDataToStorage(data.key, data.data);
            }
            
            await refreshUserData();
            console.log("[PlayerStorageInitializer] User data refreshed after sync event");
          } finally {
            syncInProgressRef.current = false;
          }
        },
        // Login handler
        async (userData) => {
          console.log("[PlayerStorageInitializer] Login event received", userData?.email || "unknown user");
          
          if (userData) {
            saveDataToStorage(STORAGE_KEY_CURRENT_USER, userData);
            console.log("[PlayerStorageInitializer] User data saved from login event");
          }
          
          await refreshUserData();
          
          // Only show toast in development
          if (!isProduction) {
            toast({
              title: "Login Detected",
              description: "Your account has been logged in from another device.",
            });
          }
        },
        // Logout handler
        () => {
          console.log("[PlayerStorageInitializer] Logout event received");
          
          // Only show toast in development
          if (!isProduction) {
            toast({
              title: "Logged Out",
              description: "You have been logged out from another device.",
            });
          }
          
          // Remove current user data
          localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          sessionStorage.removeItem(STORAGE_KEY_CURRENT_USER);
          console.log("[PlayerStorageInitializer] User data cleared after logout event");
          
          // Reload the page to reset the app state
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        },
        // Approval handler
        async (userId) => {
          console.log("[PlayerStorageInitializer] Approval event received for:", userId);
          
          // Only show toast in development
          if (!isProduction) {
            toast({
              title: "Account Status Updated",
              description: "Your account status has been updated. The page will refresh to apply changes.",
              duration: 4000,
            });
          }
          
          // Refresh user data
          await refreshUserData();
          console.log("[PlayerStorageInitializer] User data refreshed after approval event");
          
          // Reload the page to ensure all components reflect the new approval status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      );
      
      return () => {
        // Clean up global functions
        delete window.ncrForceSyncFunction;
        delete window.ncrClearAllData;
        window.ncrIsResetting = false;
        
        // Cleanup sync listeners
        cleanup();
        console.log("[PlayerStorageInitializer] Component unmounting");
      };
    } catch (error) {
      console.error("[PlayerStorageInitializer] Error initializing storage:", error);
      
      // Only show toast in development
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

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
