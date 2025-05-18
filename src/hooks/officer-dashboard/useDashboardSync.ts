
import { useState, useCallback, useRef } from 'react';
import { logMessage, LogLevel } from '@/utils/debugLogger';

export function useDashboardSync() {
  const [syncAttemptCount, setSyncAttemptCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  const syncInProgress = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const syncDashboardData = useCallback(async (showNotification = false): Promise<boolean> => {
    // Prevent concurrent sync operations
    if (syncInProgress.current) {
      return false;
    }
    
    try {
      syncInProgress.current = true;
      setIsSyncing(true);
      setSyncError(null);
      
      logMessage(LogLevel.INFO, 'useDashboardSync', 'Starting dashboard data sync');
      
      // Clear any existing timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Set a timeout to prevent hanging sync operations
      const syncTimeoutPromise = new Promise<boolean>((_, reject) => {
        syncTimeoutRef.current = setTimeout(() => {
          reject(new Error('Sync operation timed out'));
        }, 8000);
      });
      
      // Simulate a successful sync (replace with actual sync logic)
      const actualSyncPromise = new Promise<boolean>(resolve => {
        setTimeout(() => resolve(true), 1000);
      });
      
      // Race between timeout and actual sync
      const success = await Promise.race([actualSyncPromise, syncTimeoutPromise]);
      
      // Update state on success
      setSyncAttemptCount(prev => prev + 1);
      setSyncSuccess(true);
      setLastSyncTime(new Date());
      
      logMessage(LogLevel.INFO, 'useDashboardSync', 'Dashboard sync completed successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(LogLevel.ERROR, 'useDashboardSync', 'Dashboard sync failed:', error);
      
      setSyncSuccess(false);
      setSyncError(errorMessage);
      return false;
    } finally {
      // Clean up
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, []);
  
  const resetAttemptCounter = useCallback(() => {
    setSyncAttemptCount(0);
    setSyncSuccess(null);
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
    syncError
  };
}
