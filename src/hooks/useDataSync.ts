
import { useState, useCallback, useEffect, useRef } from 'react';
import { syncStorage } from "@/utils/storageUtils";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";

interface DataSyncOptions {
  syncKeys?: string[];
  autoSyncInterval?: number; // in milliseconds
  onSyncSuccess?: () => void;
  onSyncError?: (error: Error) => void;
}

export function useDataSync({
  syncKeys = ['ncr_tournaments', 'ncr_players', 'ncr_users'],
  autoSyncInterval = 300000, // 5 minutes by default
  onSyncSuccess,
  onSyncError
}: DataSyncOptions = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  const syncInProgressRef = useRef(false);
  const { toast } = useToast();

  const syncData = useCallback(async (showToast = false) => {
    // Prevent concurrent sync operations
    if (syncInProgressRef.current) {
      logMessage(LogLevel.INFO, 'useDataSync', 'Sync already in progress, skipping');
      return false;
    }

    syncInProgressRef.current = true;
    setIsSyncing(true);
    setSyncError(undefined);

    try {
      logMessage(LogLevel.INFO, 'useDataSync', 'Starting data sync', { keys: syncKeys });

      // Sync all requested keys
      await Promise.all(syncKeys.map(key => 
        syncStorage([key]).catch(error => {
          logMessage(LogLevel.WARNING, 'useDataSync', `Error syncing ${key}`, error);
          return null; // Continue with other syncs even if one fails
        })
      ));

      setLastSyncTime(new Date());
      setSyncStatus('success');
      
      if (showToast) {
        toast({
          title: "Sync Complete",
          description: "Your data has been successfully refreshed."
        });
      }
      
      if (onSyncSuccess) {
        onSyncSuccess();
      }

      logMessage(LogLevel.INFO, 'useDataSync', 'Data sync completed successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      setSyncStatus('error');
      setSyncError(errorMessage);
      
      logMessage(LogLevel.ERROR, 'useDataSync', 'Data sync failed', { error: errorMessage });
      
      if (showToast) {
        toast({
          title: "Sync Failed",
          description: "There was an issue refreshing your data. Please try again.",
          variant: "destructive"
        });
      }
      
      if (onSyncError && error instanceof Error) {
        onSyncError(error);
      }
      
      return false;
    } finally {
      setIsSyncing(false);
      
      // Add a short delay before allowing another sync attempt
      setTimeout(() => {
        syncInProgressRef.current = false;
      }, 1000);
    }
  }, [syncKeys, toast, onSyncSuccess, onSyncError]);

  // Set up automatic sync interval
  useEffect(() => {
    const intervalId = setInterval(() => {
      if (!syncInProgressRef.current) {
        syncData(false);
      }
    }, autoSyncInterval);
    
    return () => clearInterval(intervalId);
  }, [syncData, autoSyncInterval]);

  // Initial sync on mount
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      syncData(false);
    }, 1000); // slight delay on first load
    
    return () => clearTimeout(timeoutId);
  }, [syncData]);

  return {
    isSyncing,
    syncStatus,
    lastSyncTime,
    syncError,
    syncData,
    manualSync: () => syncData(true) // Shows toast notifications
  };
}
