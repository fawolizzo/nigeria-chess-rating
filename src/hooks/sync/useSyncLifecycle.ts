
import { useEffect, useRef, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * Hook for managing sync lifecycle (mount/unmount and periodic sync)
 */
export function useSyncLifecycle(syncFunction: (showToast?: boolean) => Promise<boolean>) {
  const mountedRef = useRef(true);
  
  /**
   * Sets up sync lifecycle hooks
   */
  const setupSyncLifecycle = useCallback(() => {
    useEffect(() => {
      mountedRef.current = true;
      
      // Small delay before initial sync
      const timer = setTimeout(() => {
        if (mountedRef.current) {
          syncFunction(false);
        }
      }, 1000);
      
      // Periodic background sync every 5 minutes
      const intervalId = setInterval(() => {
        if (mountedRef.current) {
          syncFunction(false);
        }
      }, 5 * 60 * 1000);
      
      // Cleanup on unmount
      return () => {
        mountedRef.current = false;
        clearTimeout(timer);
        clearInterval(intervalId);
        
        logMessage(LogLevel.INFO, 'useSyncLifecycle', 'Cleaned up sync lifecycle');
      };
    }, [syncFunction]);
  }, [syncFunction]);
  
  return {
    setupSyncLifecycle,
    mountedRef
  };
}
