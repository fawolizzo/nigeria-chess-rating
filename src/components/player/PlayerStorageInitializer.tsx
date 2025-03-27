
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { STORAGE_KEY_CURRENT_USER, STORAGE_KEY_USERS, SyncEventType } from "@/types/userTypes";
import {
  setupSyncListeners,
  requestDataSync,
  getDataFromStorage,
  saveDataToStorage
} from "@/utils/deviceSync";
import { useUser } from "@/contexts/UserContext";

/**
 * Component to initialize storage and handle sync events on mount
 */
const PlayerStorageInitializer: React.FC = () => {
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const { refreshUserData, clearAllData } = useUser();
  
  useEffect(() => {
    console.log("[PlayerStorageInitializer] Component mounting");
    
    try {
      // Initialize global functions for cross-device sync
      window.ncrForceSyncFunction = async (keys?: string[]) => {
        console.log("[PlayerStorageInitializer] Global force sync triggered", keys);
        return await refreshUserData();
      };
      
      window.ncrClearAllData = async () => {
        console.log("[PlayerStorageInitializer] Global clear data triggered");
        return await clearAllData();
      };
      
      // Define an initialization function
      const initialize = async () => {
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
        
        // Request sync from other devices
        requestDataSync();
        
        // Refresh user data
        await refreshUserData();
        
        console.log("[PlayerStorageInitializer] Initialization complete");
      };
      
      // Run initialization
      initialize().then(() => {
        setIsInitialized(true);
      }).catch(error => {
        console.error("[PlayerStorageInitializer] Initialization error:", error);
        setIsInitialized(true); // Set initialized anyway to allow the app to function
      });
      
      // Set up sync listeners
      const cleanup = setupSyncListeners(
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
        // Sync handler
        async (data) => {
          console.log(`[PlayerStorageInitializer] Sync event received`, data);
          
          if (data && data.key) {
            // Handle data if available
            saveDataToStorage(data.key, data.data);
          }
          
          await refreshUserData();
        },
        // Login handler
        async (userData) => {
          console.log("[PlayerStorageInitializer] Login event received", userData);
          
          if (userData) {
            saveDataToStorage(STORAGE_KEY_CURRENT_USER, userData);
          }
          
          await refreshUserData();
          
          toast({
            title: "Login Detected",
            description: "Your account has been logged in from another device.",
          });
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
        // Approval handler
        async (userId) => {
          console.log("[PlayerStorageInitializer] Approval event received for:", userId);
          
          toast({
            title: "Account Status Updated",
            description: "Your account status has been updated. Please refresh the page.",
          });
          
          // Refresh user data
          await refreshUserData();
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
      
      toast({
        title: "Initialization Error",
        description: "There was a problem initializing the application. Please refresh the page.",
        variant: "destructive",
      });
      
      setIsInitialized(true);
    }
  }, [toast, refreshUserData, clearAllData]);

  return null; // This component doesn't render anything
};

export default PlayerStorageInitializer;
