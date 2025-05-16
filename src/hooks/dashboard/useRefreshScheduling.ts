
import { useEffect, useRef, useCallback } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * Hook for managing automatic dashboard refresh scheduling
 */
export function useRefreshScheduling(refreshFunction: () => Promise<void>) {
  // Ref to store the interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to prevent memory leaks on unmount
  const mountedRef = useRef(true);

  /**
   * Set up automatic refresh on a schedule
   */
  const setupRefreshInterval = useCallback((intervalMinutes: number = 5) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up new refresh interval
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        logMessage(LogLevel.INFO, 'useRefreshScheduling', 'Automatic refresh triggered');
        refreshFunction();
      }
    }, intervalMinutes * 60 * 1000); // Convert minutes to milliseconds
    
    logMessage(LogLevel.INFO, 'useRefreshScheduling', `Refresh interval set for every ${intervalMinutes} minutes`);
  }, [refreshFunction]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return {
    setupRefreshInterval,
    mountedRef
  };
}
