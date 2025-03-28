
import { useState, useEffect, useCallback } from 'react';
import { syncStorage, forceSyncAllStorage } from '@/utils/storageUtils';
import { 
  startSyncMonitoring, 
  trackSyncOperation, 
  completeSyncOperation, 
  endSyncMonitoring,
  monitorSync
} from '@/utils/monitorSync';
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
    
    // Start monitoring session
    const sessionId = startSyncMonitoring('silent-sync');
    
    try {
      // Track this sync operation
      const opId = trackSyncOperation('sync-storage', keys.join(','));
      
      // Perform the sync
      const success = await syncStorage(keys);
      setLastSyncSuccess(success);
      setLastSyncTime(new Date());
      
      // Record the result
      completeSyncOperation(opId, success);
      
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
      
      // End monitoring
      endSyncMonitoring();
      
      return success;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SilentSync', 'Sync error', error);
      setLastSyncSuccess(false);
      setLastSyncTime(new Date());
      
      // End monitoring
      endSyncMonitoring();
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      } else {
        console.error('Silent sync error:', error);
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
  }, [isSyncing, keys, retryCount, maxRetries, onSyncComplete, onSyncError]);
  
  const forceSync = useCallback(async (): Promise<boolean> => {
    if (isSyncing) {
      logMessage(LogLevel.WARNING, 'SilentSync', 'Force sync requested while sync in progress, ignoring');
      return false;
    }
    
    logSyncEvent('Starting force sync', 'SilentSync', { keys });
    setIsSyncing(true);
    
    // Monitor this operation
    return monitorSync('force-sync-all', keys.join(','), async () => {
      try {
        const success = await forceSyncAllStorage(keys);
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
        logMessage(LogLevel.ERROR, 'SilentSync', 'Force sync error', error);
        setLastSyncSuccess(false);
        setLastSyncTime(new Date());
        
        if (onSyncError && error instanceof Error) {
          onSyncError(error);
        } else {
          console.error('Silent force sync error:', error);
        }
        
        return false;
      } finally {
        setIsSyncing(false);
      }
    });
  }, [isSyncing, keys, onSyncComplete, onSyncError]);
  
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
