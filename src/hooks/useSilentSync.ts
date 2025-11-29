import { useState, useEffect, useCallback } from 'react';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { STORAGE_KEY_USERS } from '@/types/userTypes';

// Stub implementations
const forceSyncAllStorage = async (keys?: string[]) => {
  return true;
};

const withTimeout = async <T>(
  fn: () => Promise<T>,
  label: string,
  timeout: number,
  onTimeout: () => T
): Promise<T> => {
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timeout`)), timeout)
      ),
    ]);
  } catch (error) {
    return onTimeout();
  }
};

interface UseSilentSyncOptions {
  syncOnMount?: boolean;
  keys?: string[];
  syncInterval?: number | null;
  syncTimeout?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: any) => void;
  prioritizeUserData?: boolean;
}

/**
 * Hook for silently synchronizing storage data
 * Contains built-in timeout and retry logic
 */
const useSilentSync = ({
  syncOnMount = false,
  keys,
  syncInterval = null,
  syncTimeout = 5000,
  onSyncComplete,
  onSyncError,
  prioritizeUserData = false,
}: UseSilentSyncOptions = {}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Define sync function with built-in timeout
  const sync = useCallback(async () => {
    if (isSyncing) return false;

    try {
      setIsSyncing(true);

      // Determine which keys to sync
      let keysToSync = keys;
      if (prioritizeUserData && (!keys || !keys.includes(STORAGE_KEY_USERS))) {
        // If prioritizeUserData is true and STORAGE_KEY_USERS isn't already included
        keysToSync = [...(keys || []), STORAGE_KEY_USERS];
      }

      logMessage(
        LogLevel.INFO,
        'useSilentSync',
        `Starting sync ${keysToSync ? `for keys: ${keysToSync.join(', ')}` : 'for all keys'}`
      );

      // Use withTimeout
      const result = await withTimeout(
        async () => (keysToSync ? forceSyncAllStorage(keysToSync) : forceSyncAllStorage()),
        'Storage Sync',
        syncTimeout,
        () => false
      );

      setLastSyncSuccess(result);
      setLastSyncTime(new Date());

      if (result) {
        setRetryCount(0);
        if (onSyncComplete) onSyncComplete();
        logMessage(
          LogLevel.INFO,
          'useSilentSync',
          'Sync completed successfully'
        );
      } else if (retryCount < MAX_RETRIES) {
        // Auto-retry if sync failed
        logMessage(
          LogLevel.WARNING,
          'useSilentSync',
          `Sync failed, retrying (${retryCount + 1}/${MAX_RETRIES})`
        );
        setRetryCount((prev) => prev + 1);
        // Schedule retry after a short delay
        setTimeout(() => {
          sync();
        }, 1000);
      } else {
        logMessage(
          LogLevel.ERROR,
          'useSilentSync',
          `Sync failed after ${MAX_RETRIES} retries`
        );
        if (onSyncError)
          onSyncError(new Error('Sync failed after multiple attempts'));
      }

      return result;
    } catch (error) {
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      logMessage(LogLevel.ERROR, 'useSilentSync', 'Sync error:', error);

      if (onSyncError) onSyncError(error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [
    isSyncing,
    keys,
    onSyncComplete,
    onSyncError,
    retryCount,
    syncTimeout,
    prioritizeUserData,
  ]);

  // Add a forceSync function that prioritizes user data
  const forceSync = useCallback(async () => {
    // Always include user data in the sync to ensure login works across devices
    const userDataKeys = [...(keys || [])];
    if (!userDataKeys.includes(STORAGE_KEY_USERS)) {
      userDataKeys.push(STORAGE_KEY_USERS);
    }

    setIsSyncing(true);
    try {
      logMessage(
        LogLevel.INFO,
        'useSilentSync',
        'Force syncing with priority on user data'
      );

      // Use withTimeout
      const result = await withTimeout(
        async () => forceSyncAllStorage(userDataKeys),
        'Force Storage Sync',
        syncTimeout,
        () => false
      );

      setLastSyncSuccess(result);
      setLastSyncTime(new Date());

      if (result) {
        if (onSyncComplete) onSyncComplete();
        logMessage(
          LogLevel.INFO,
          'useSilentSync',
          'Force sync completed successfully'
        );
      } else {
        if (onSyncError) onSyncError(new Error('Force sync failed'));
        logMessage(LogLevel.ERROR, 'useSilentSync', 'Force sync failed');
      }

      return result;
    } catch (error) {
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      logMessage(LogLevel.ERROR, 'useSilentSync', 'Force sync error:', error);

      if (onSyncError) onSyncError(error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [keys, onSyncComplete, onSyncError, syncTimeout]);

  // Initial sync on mount
  useEffect(() => {
    let isMounted = true;

    if (syncOnMount) {
      // Slight delay to allow component to mount fully
      const timeoutId = setTimeout(() => {
        if (isMounted) {
          sync();
        }
      }, 200);

      return () => {
        isMounted = false;
        clearTimeout(timeoutId);
      };
    }

    return () => {
      isMounted = false;
    };
  }, [sync, syncOnMount]);

  // Set up sync interval if specified
  useEffect(() => {
    if (!syncInterval) return;

    const intervalId = setInterval(() => {
      sync();
    }, syncInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [sync, syncInterval]);

  return {
    sync,
    forceSync,
    isSyncing,
    lastSyncSuccess,
    lastSyncTime,
  };
};

export default useSilentSync;
