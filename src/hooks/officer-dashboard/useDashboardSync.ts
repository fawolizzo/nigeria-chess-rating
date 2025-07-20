import { useState, useCallback } from 'react';
import { logMessage, LogLevel } from '@/utils/debugLogger';

/**
 * Simplified placeholder for useDashboardSync.
 * Its original complex logic for managing sync attempts and timeouts
 * is no longer driven by useOfficerDashboardLoading.
 * This hook is now effectively a no-op or provides static values.
 */
export function useDashboardSync() {
  const [syncAttemptCount, setSyncAttemptCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false); // Kept for compatibility, but won't be actively true for long
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(true); // Default to true or null
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const syncDashboardData = useCallback(
    async (showNotification = false): Promise<boolean> => {
      logMessage(
        LogLevel.INFO,
        'useDashboardSync',
        'syncDashboardData called (now a placeholder).'
      );
      // Simulate a quick, successful operation as its original purpose is removed.
      setIsSyncing(true);
      return new Promise((resolve) => {
        setTimeout(() => {
          setSyncSuccess(true);
          setLastSyncTime(new Date());
          setIsSyncing(false);
          setSyncAttemptCount((prev) => prev + 1);
          resolve(true);
        }, 50); // Very short delay
      });
    },
    []
  );

  const resetAttemptCounter = useCallback(() => {
    logMessage(
      LogLevel.INFO,
      'useDashboardSync',
      'resetAttemptCounter called.'
    );
    setSyncAttemptCount(0);
    setSyncSuccess(true); // Reset to a non-error state
    setSyncError(null);
    setLastSyncTime(null);
  }, []);

  return {
    syncDashboardData,
    resetAttemptCounter,
    syncAttemptCount,
    isSyncing,
    syncSuccess,
    lastSyncTime,
    syncError,
  };
}
