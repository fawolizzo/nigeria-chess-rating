
import { useState, useEffect, useCallback } from 'react';
import { syncStorage, forceSyncAllStorage } from '@/utils/storageUtils';
import { monitorSync } from '@/utils/monitorSync';
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
    maxRetries = 2, // Reduced max retries from 3 to 2
    syncTimeout = 5000, // Reduced timeout from 8000 to 5000 ms
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

    // Set a hard timeout to ensure we don't block the UI forever
    let timeoutId: NodeJS.Timeout | null = null;
    let syncCompleted = false;
    
    try {
      // Create a promise that resolves once the sync operation is complete or times out
      const syncPromise = new Promise<boolean>(async (resolve) => {
        // Set a timeout to force resolution if the sync takes too long
        timeoutId = setTimeout(() => {
          if (!syncCompleted) {
            logMessage(LogLevel.WARNING, 'SilentSync', `Sync operation timed out after ${syncTimeout}ms`);
            resolve(false); // Resolve with false to indicate timeout
          }
        }, syncTimeout);

        try {
          // Perform the sync operation
          const success = await monitorSync('sync-storage', keys.join(','), () => syncStorage(keys));
          syncCompleted = true;
          
          // Clear the timeout if we completed before it fired
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          resolve(success);
        } catch (error) {
          syncCompleted = true;
          
          // Clear the timeout if we completed before it fired
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          logMessage(LogLevel.ERROR, 'SilentSync', 'Sync error in sync promise', error);
          resolve(false);
        }
      });
      
      // Wait for either the sync operation to complete or timeout
      const success = await syncPromise;
      
      setLastSyncSuccess(success);
      setLastSyncTime(new Date());
      
      if (success) {
        logSyncEvent('Sync completed successfully', 'SilentSync', { keys });
        setRetryCount(0);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        logSyncEvent('Sync completed with warnings or timed out', 'SilentSync', { keys, retryCount });
        
        // Only retry once to prevent endless retries
        if (retryCount < maxRetries) {
          setRetryCount(prev => prev + 1);
          
          // Exponential backoff for retries, but cap at 3 seconds
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 3000);
          
          logSyncEvent('Scheduling retry', 'SilentSync', { 
            retryCount: retryCount + 1, 
            backoffTime 
          });
          
          // Use setTimeout instead of a blocking promise chain
          setTimeout(() => {
            sync().catch(err => {
              console.error('Retry sync error:', err);
            });
          }, backoffTime);
        } else if (onSyncError) {
          onSyncError(new Error('Sync failed after maximum retries'));
        }
      }
      
      return success;
    } catch (error) {
      // This catch block handles errors that may occur outside of the syncPromise
      logMessage(LogLevel.ERROR, 'SilentSync', 'Sync error in main function', error);
      
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      }
      
      return false;
    } finally {
      // Make sure we clean up the timeout if it's still active
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Always set isSyncing to false when we're done
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
    
    let timeoutId: NodeJS.Timeout | null = null;
    let syncCompleted = false;
    
    try {
      const syncPromise = new Promise<boolean>(async (resolve) => {
        // Set a timeout to force resolution if the sync takes too long
        timeoutId = setTimeout(() => {
          if (!syncCompleted) {
            logMessage(LogLevel.WARNING, 'SilentSync', `Force sync operation timed out after ${syncTimeout}ms`);
            resolve(false); // Resolve with false to indicate timeout
          }
        }, syncTimeout);
        
        try {
          const success = await monitorSync('force-sync-all', keys.join(','), () => forceSyncAllStorage(keys));
          syncCompleted = true;
          
          // Clear the timeout if we completed before it fired
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          resolve(success);
        } catch (error) {
          syncCompleted = true;
          
          // Clear the timeout if we completed before it fired
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          logMessage(LogLevel.ERROR, 'SilentSync', 'Force sync error in sync promise', error);
          resolve(false);
        }
      });
      
      // Wait for either the sync operation to complete or timeout
      const success = await syncPromise;
      
      setLastSyncSuccess(success);
      setLastSyncTime(new Date());
      
      if (success) {
        logSyncEvent('Force sync completed successfully', 'SilentSync');
        setRetryCount(0);
        
        if (onSyncComplete) {
          onSyncComplete();
        }
      } else {
        logSyncEvent('Force sync completed with warnings or timed out', 'SilentSync');
        
        if (onSyncError) {
          onSyncError(new Error('Force sync failed or timed out'));
        }
      }
      
      return success;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SilentSync', 'Force sync error in main function', error);
      
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      }
      
      return false;
    } finally {
      // Make sure we clean up the timeout if it's still active
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Always set isSyncing to false when we're done
      setIsSyncing(false);
    }
  }, [isSyncing, keys, syncTimeout, onSyncComplete, onSyncError]);
  
  useEffect(() => {
    // Sync on mount if configured
    if (syncOnMount) {
      let mounted = true;
      
      logSyncEvent('Auto-sync on mount', 'SilentSync', { keys });
      
      // Use setTimeout to slightly delay the initial sync to prevent UI freezing on mount
      setTimeout(() => {
        if (mounted) {
          sync().catch(error => {
            console.error('Error during mount sync:', error);
          });
        }
      }, 100);
      
      // Clean up
      return () => {
        mounted = false;
      };
    }
    
    return undefined;
  }, [sync, syncOnMount, keys]);
  
  useEffect(() => {
    // Set up sync interval if configured
    if (syncInterval > 0) {
      logSyncEvent('Setting up sync interval', 'SilentSync', { interval: syncInterval });
      
      const intervalId = window.setInterval(() => {
        logSyncEvent('Interval sync triggered', 'SilentSync');
        
        // Only sync if not already syncing
        if (!isSyncing) {
          sync().catch(error => {
            console.error('Error during interval sync:', error);
          });
        } else {
          logSyncEvent('Skipping interval sync, already syncing', 'SilentSync');
        }
      }, syncInterval);
      
      // Clean up
      return () => {
        clearInterval(intervalId);
      };
    }
    
    return undefined;
  }, [sync, syncInterval, isSyncing]);
  
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
