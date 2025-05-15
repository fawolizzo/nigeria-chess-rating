
import { useCallback, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function useDashboardSync() {
  const { forceSync } = useUser();
  const loadAttempts = useRef(0);
  
  const syncDashboardData = useCallback(async () => {
    try {
      // Track loading attempts
      loadAttempts.current += 1;
      
      // Small delay if this is a retry to prevent hammering
      if (loadAttempts.current > 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Set a timeout for the sync operation
      const syncPromise = forceSync();
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Sync operation timed out')), 10000);
      });
      
      // Race the sync operation against the timeout
      const syncResult = await Promise.race([syncPromise, timeoutPromise]);
      
      if (syncResult === true) {
        logMessage(LogLevel.INFO, 'useDashboardSync', 'Dashboard sync completed successfully');
        return true;
      } else {
        logMessage(LogLevel.WARNING, 'useDashboardSync', 'Sync returned false');
        return false;
      }
    } catch (syncError) {
      const errorMessage = syncError instanceof Error ? syncError.message : String(syncError);
      logMessage(LogLevel.WARNING, 'useDashboardSync', 'Sync error', { error: errorMessage });
      throw syncError;
    }
  }, [forceSync]);
  
  const resetAttemptCounter = useCallback(() => {
    loadAttempts.current = 0;
  }, []);
  
  return {
    syncDashboardData,
    loadAttempts,
    resetAttemptCounter
  };
}
