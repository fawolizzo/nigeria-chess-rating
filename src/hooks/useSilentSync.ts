
import { useState, useEffect } from 'react';
import { syncStorage, forceSyncAllStorage } from '@/utils/storageUtils';

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
}

const useSilentSync = (options: UseSilentSyncOptions = {}): UseSilentSyncResult => {
  const {
    keys = [],
    syncOnMount = true,
    syncInterval = 0,
    onSyncComplete,
    onSyncError
  } = options;
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncSuccess, setLastSyncSuccess] = useState<boolean | null>(null);
  
  const sync = async (): Promise<boolean> => {
    if (isSyncing) return false;
    
    setIsSyncing(true);
    
    try {
      const success = await syncStorage(keys);
      setLastSyncSuccess(success);
      
      if (success && onSyncComplete) {
        onSyncComplete();
      }
      
      return success;
    } catch (error) {
      setLastSyncSuccess(false);
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      } else {
        console.error('Silent sync error:', error);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  const forceSync = async (): Promise<boolean> => {
    if (isSyncing) return false;
    
    setIsSyncing(true);
    
    try {
      const success = await forceSyncAllStorage(keys);
      setLastSyncSuccess(success);
      
      if (success && onSyncComplete) {
        onSyncComplete();
      }
      
      return success;
    } catch (error) {
      setLastSyncSuccess(false);
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      } else {
        console.error('Silent force sync error:', error);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
    }
  };
  
  useEffect(() => {
    // Sync on mount if configured
    if (syncOnMount) {
      sync().catch(console.error);
    }
    
    // Set up sync interval if configured
    let intervalId: number | undefined;
    
    if (syncInterval > 0) {
      intervalId = window.setInterval(() => {
        sync().catch(console.error);
      }, syncInterval);
    }
    
    // Clean up
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [syncOnMount, syncInterval]);
  
  return {
    sync,
    forceSync,
    isSyncing,
    lastSyncSuccess
  };
};

export default useSilentSync;
