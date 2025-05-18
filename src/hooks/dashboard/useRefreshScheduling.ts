
import { useCallback, useEffect, useRef } from "react";
import { logMessage, LogLevel } from "@/utils/debugLogger";

/**
 * Hook to manage refresh scheduling for dashboard data
 */
export function useRefreshScheduling(loadData: () => Promise<void> | void) {
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const setupRefreshInterval = useCallback((minutes: number = 5) => {
    // Clear any existing refresh interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Set up a new refresh interval if minutes > 0
    if (minutes > 0) {
      const ms = minutes * 60 * 1000; // Convert minutes to milliseconds
      logMessage(LogLevel.INFO, 'useRefreshScheduling', `Setting up refresh interval: ${minutes} minutes`);
      
      refreshIntervalRef.current = setInterval(() => {
        logMessage(LogLevel.INFO, 'useRefreshScheduling', 'Automatic refresh triggered');
        loadData();
      }, ms);
    }
  }, [loadData]);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    };
  }, []);

  return { setupRefreshInterval };
}
