
import { useState, useEffect, useCallback } from 'react';
import { syncStorage, forceSyncAllStorage } from '@/utils/storageUtils';
import { monitorSync, startSyncMonitoring, trackSyncOperation, completeSyncOperation, endSyncMonitoring } from '@/utils/monitorSync';
import { logSyncEvent, LogLevel, logMessage } from '@/utils/debugLogger';

/**
 * Hook for silently synchronizing data across devices
 * Without showing any UI indicators to the user
 */
interface UseSilentSyncOptions {
  /** Keys to sync */
  keys?: string[];
  /** Auto-sync on mount */
  syncOnMount?: boolean;
  /** Sync interval in ms (0 to disable) */
  syncInterval?: number;
  /** Max retries if sync fails */
  maxRetries?: number;
  /** Maximum time in ms to wait for sync before timing out */
  syncTimeout?: number;
  /** Callback after successful sync */
  onSyncComplete?: () => void;
  /** Callback on sync error */
  onSyncError?: (error: Error) => void;
}

interface UseSilentSyncResult {
  /** Trigger sync manually */
  sync: () => Promise<boolean>;
  /** Trigger force sync manually */
  forceSync: () => Promise<boolean>;
  /** Is currently syncing */
  isSyncing: boolean;
  /** Last sync result */
  lastSyncSuccess: boolean | null;
  /** Last sync timestamp */
  lastSyncTime: Date | null;
  /** Retry count */
  retryCount: number;
}

const useSilentSync = (options: UseSilentSyncOptions = {}): UseSilentSyncResult => {
  const {
    keys = [],
    syncOnMount = true,
    syncInterval = 0,
    maxRetries = 3,
    syncTimeout = 8000, // Add a default timeout of 8 seconds
    onSyncComplete,
    onSyncError
  } = options;
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const sync = useCallback(async (): Promise<boolean> => {
    if (isSyncing) {
      logMessage(LogLevel.WARNING, 'SilentSync', 'Sync already in progress, ignoring request');
      return false;
    }
    
    logSyncEvent('Starting sync', 'SilentSync', { keys });
    setIsSyncing(true);
    
    // Create a timeout promise that rejects after syncTimeout milliseconds
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Sync operation timed out after ${syncTimeout}ms`));
      }, syncTimeout);
    });
    
    try {
      // Perform the sync with monitoring and timeout
      const syncPromise = monitorSync('sync-storage', keys.join(','), () => syncStorage(keys));
      
      // Race between the sync operation and the timeout
      const success = await Promise.race([syncPromise, timeoutPromise]);
      
      setLastSyncSuccess(success);
      setLastSyncTime(new Date());
      
      if (success) {
        logSyncEvent('Sync completed successfully', 'SilentSync', { keys });
        setRetryCount(0);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        logSyncEvent('Sync completed with warnings', 'SilentSync', { keys, retryCount });
        
        // Retry if needed
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          
          // Exponential backoff for retries
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
          
          logSyncEvent('Scheduling retry', 'SilentSync', { 
            retryCount: retryCount + 1, 
            backoffTime 
          });
          
          setTimeout(() => {
            sync().catch(console.error);
          }, backoffTime);
        }
      }
      
      return success;
    } catch (error) {
      const isTimeout = error instanceof Error && error.message.includes('timed out');
      
      if (isTimeout) {
        logMessage(LogLevel.ERROR, 'SilentSync', 'Sync operation timed out', error);
      } else {
        logMessage(LogLevel.ERROR, 'SilentSync', 'Sync error', error);
      }
      
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      } else {
        console.error('Silent sync error:', error);
      }
      
      // For timeout errors, force completion to unblock the UI
      if (isTimeout) {
        logSyncEvent('Forcing completion after timeout', 'SilentSync');
        // Force success to prevent UI from hanging
        return true;
      }
      
      // Retry if needed
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        
        // Exponential backoff for retries
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 8000);
        
        logSyncEvent('Scheduling retry after error', 'SilentSync', { 
          retryCount: retryCount + 1, 
          backoffTime,
          error: error instanceof Error ? error.message : String(error)
        });
        
        setTimeout(() => {
          sync().catch(console.error);
        }, backoffTime);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, keys, retryCount, maxRetries, syncTimeout, onSyncComplete, onSyncError]);
  
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (isSyncing) {
      logMessage(LogLevel.WARNING, 'SilentSync', 'Force sync requested while sync in progress, ignoring');
      return false;
    }
    
    logSyncEvent('Starting force sync', 'SilentSync', { keys });
    setIsSyncing(true);
    
    // Create a timeout promise that resolves after syncTimeout milliseconds
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Force sync operation timed out after ${syncTimeout}ms`));
      }, syncTimeout);
    });
    
    // Monitor this operation with timeout
    try {
      const syncPromise = monitorSync('force-sync-all', keys.join(','), async () => {
        try {
          const success = await forceSyncAllStorage(keys);
          return success;
        } catch (error) {
          logMessage(LogLevel.ERROR, 'SilentSync', 'Force sync operation error', error);
          throw error;
        }
      });
      
      // Race between the sync operation and the timeout
      const success = await Promise.race([syncPromise, timeoutPromise]);
      
      setLastSyncSuccess(success);
      setLastSyncTime(new Date());
      
      if (success) {
        logSyncEvent('Force sync completed successfully', 'SilentSync');
        setRetryCount(0);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        logSyncEvent('Force sync completed with warnings', 'SilentSync');
        // No auto-retry for force sync
      }
      
      return success;
    } catch (error) {
      const isTimeout = error instanceof Error && error.message.includes('timed out');
      
      if (isTimeout) {
        logMessage(LogLevel.ERROR, 'SilentSync', 'Force sync operation timed out', error);
      } else {
        logMessage(LogLevel.ERROR, 'SilentSync', 'Force sync error', error);
      }
      
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      } else {
        console.error('Silent force sync error:', error);
      }
      
      // For timeout errors, force completion to unblock the UI
      if (isTimeout) {
        logSyncEvent('Forcing completion after timeout', 'SilentSync');
        // Return success to unblock UI
        return true;
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, keys, syncTimeout, onSyncComplete, onSyncError]);
  
  useEffect(() => {
    // Sync on mount if configured
    if (syncOnMount) {
      logSyncEvent('Auto-sync on mount', 'SilentSync', { keys });
      sync().catch(error => {
        console.error('Error during mount sync:', error);
      });
    }
    
    // Set up sync interval if configured
    let intervalId: number | undefined;
    
    if (syncInterval > 0) {
      logSyncEvent('Setting up sync interval', 'SilentSync', { interval: syncInterval });
      
      intervalId = window.setInterval(() => {
        logSyncEvent('Interval sync triggered', 'SilentSync');
        sync().catch(error => {
          console.error('Error during interval sync:', error);
        });
      }, syncInterval);
    }
    
    // Clean up
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [sync, syncOnMount, syncInterval, keys]);
  
  return {
    sync,
    forceSync,
    isSyncing,
    lastSyncSuccess,
    lastSyncTime,
    retryCount
  };
};

export default useSilentSync;
