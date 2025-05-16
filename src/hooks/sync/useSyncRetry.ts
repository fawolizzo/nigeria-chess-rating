
import { useRef, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * Hook for managing sync retry logic
 */
export function useSyncRetry() {
  const retryCountRef = useRef(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxRetries = 2;
  
  /**
   * Schedules a retry for sync operations
   * @param syncFunction Function to retry
   * @returns Promise<boolean> indicating if retry was scheduled
   */
  const scheduleRetry = useCallback(async (syncFunction: (showToast: boolean) => Promise<boolean>) => {
    retryCountRef.current++;
    logMessage(LogLevel.INFO, 'useSyncRetry', `Scheduling retry ${retryCountRef.current}/${maxRetries}`);
    
    // Schedule a retry with exponential backoff
    const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
    
    return new Promise<boolean>(resolve => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(async () => {
        try {
          await syncFunction(false);
          resolve(true);
        } catch (error) {
          resolve(false);
        }
      }, retryDelay);
    });
  }, [maxRetries]);
  
  /**
   * Clears any scheduled retries
   */
  const clearRetries = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
  }, []);
  
  return {
    retryCountRef,
    maxRetries,
    scheduleRetry,
    clearRetries,
    syncTimeoutRef
  };
}
