
import { useState, useEffect, useCallback } from 'react';
import { forceSyncAllStorage } from '@/utils/storageUtils';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { withTimeout } from '@/utils/monitorSync';

interface UseSilentSyncOptions {
  syncOnMount?: boolean;
  keys?: string[];
  syncInterval?: number | null;
  syncTimeout?: number;
  onSyncComplete?: () => void;
  onSyncError?: (error: any) => void;
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
  onSyncError
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
      logMessage(LogLevel.INFO, 'useSilentSync', `Starting sync ${keys ? `for keys: ${keys.join(', ')}` : 'for all keys'}`);
      
      // Use withTimeout to ensure sync doesn't hang
      const result = await withTimeout(
        () => keys ? forceSyncAllStorage(keys) : forceSyncAllStorage(),
        false,
        syncTimeout,
        'Storage Sync'
      );
      
      setLastSyncSuccess(result);
      setLastSyncTime(new Date());
      
      if (result) {
        setRetryCount(0);
        if (onSyncComplete) onSyncComplete();
        logMessage(LogLevel.INFO, 'useSilentSync', 'Sync completed successfully');
      } else if (retryCount < MAX_RETRIES) {
        // Auto-retry if sync failed
        logMessage(LogLevel.WARNING, 'useSilentSync', `Sync failed, retrying (${retryCount + 1}/${MAX_RETRIES})`);
        setRetryCount(prev => prev + 1);
        // Schedule retry after a short delay
        setTimeout(() => {
          sync();
        }, 1000);
      } else {
        logMessage(LogLevel.ERROR, 'useSilentSync', `Sync failed after ${MAX_RETRIES} retries`);
        if (onSyncError) onSyncError(new Error('Sync failed after multiple attempts'));
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
  }, [isSyncing, keys, onSyncComplete, onSyncError, retryCount, syncTimeout]);

  // Add a forceSync function that's essentially an alias for sync
  const forceSync = useCallback(async () => {
    return await sync();
  }, [sync]);

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
    forceSync, // Add the forceSync alias to the return value
    isSyncing,
    lastSyncSuccess,
    lastSyncTime
  };
};

export default useSilentSync;
