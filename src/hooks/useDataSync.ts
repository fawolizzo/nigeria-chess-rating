import { useState, useCallback, useEffect, useRef } from 'react';
// import { syncStorage } from "@/utils/storageUtils"; // Removed syncStorage
import { useToast } from '@/hooks/use-toast';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface DataSyncOptions {
  // syncKeys?: string[]; // Removed syncKeys as it's no longer used for localStorage sync
  autoSyncInterval?: number; // in milliseconds
  onSyncSuccess?: () => Promise<void> | void; // Allow onSyncSuccess to be async
  onSyncError?: (error: Error) => void;
}

export function useDataSync({
  // syncKeys = [], // Default to empty array, not used
  autoSyncInterval = 300000, // 5 minutes by default
  onSyncSuccess,
  onSyncError,
}: DataSyncOptions = {}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  const syncInProgressRef = useRef(false);
  const { toast } = useToast();

  const syncData = useCallback(
    async (showToast = false) => {
      if (syncInProgressRef.current) {
        logMessage(
          LogLevel.INFO,
          'useDataSync',
          'Sync operation already in progress, skipping.'
        );
        return false;
      }

      syncInProgressRef.current = true;
      setIsSyncing(true);
      setSyncError(undefined);
      setSyncStatus('idle'); // Reset status at the beginning of a sync attempt

      logMessage(
        LogLevel.INFO,
        'useDataSync',
        'Attempting to refresh data via onSyncSuccess callback.'
      );

      try {
        if (onSyncSuccess) {
          await onSyncSuccess(); // Await the callback, which now handles data fetching
        } else {
          logMessage(
            LogLevel.WARNING,
            'useDataSync',
            'onSyncSuccess callback is not provided. Sync does nothing.'
          );
        }

        setLastSyncTime(new Date());
        setSyncStatus('success');

        if (showToast) {
          toast({
            title: 'Refresh Complete',
            description: 'Data has been successfully refreshed.',
          });
        }
        logMessage(
          LogLevel.INFO,
          'useDataSync',
          'Data refresh via callback completed successfully.'
        );
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setSyncStatus('error');
        setSyncError(errorMessage);
        logMessage(
          LogLevel.ERROR,
          'useDataSync',
          'Data refresh via callback failed',
          { error: errorMessage }
        );

        if (showToast) {
          toast({
            title: 'Refresh Failed',
            description:
              'There was an issue refreshing your data. Please try again.',
            variant: 'destructive',
          });
        }

        if (onSyncError && error instanceof Error) {
          onSyncError(error);
        }
        return false;
      } finally {
        setIsSyncing(false);
        setTimeout(() => {
          syncInProgressRef.current = false;
        }, 1000); // Prevent rapid successive syncs
      }
    },
    [toast, onSyncSuccess, onSyncError]
  );

  // Set up automatic sync interval
  useEffect(() => {
    if (autoSyncInterval > 0 && onSyncSuccess) {
      // Only run interval if onSyncSuccess is provided
      const intervalId = setInterval(() => {
        if (!syncInProgressRef.current) {
          logMessage(
            LogLevel.INFO,
            'useDataSync',
            'Automatic data refresh triggered by interval.'
          );
          syncData(false); // Don't show toast for auto-syncs
        }
      }, autoSyncInterval);
      return () => clearInterval(intervalId);
    }
    return () => {}; // No-op cleanup if interval isn't set
  }, [syncData, autoSyncInterval, onSyncSuccess]);

  // Initial sync on mount (optional, can be driven by parent component's useEffect)
  // For now, keeping it to maintain existing behavior of an initial attempt to refresh.
  useEffect(() => {
    if (onSyncSuccess) {
      // Only run initial sync if onSyncSuccess is provided
      const timeoutId = setTimeout(() => {
        logMessage(
          LogLevel.INFO,
          'useDataSync',
          'Initial data refresh triggered on mount.'
        );
        syncData(false);
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
    return () => {};
  }, [syncData, onSyncSuccess]); // Ensure onSyncSuccess is in dependency array

  return {
    isSyncing,
    syncStatus,
    lastSyncTime,
    syncError,
    syncData,
    manualSync: () => syncData(true), // Shows toast notifications
  };
}
