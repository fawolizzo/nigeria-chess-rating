import { useState, useCallback } from 'react';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { useToast } from '@/components/ui/use-toast';

export function useOfficerDashboardSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { toast } = useToast();

  const syncDashboardData = useCallback(
    async (showToast = false) => {
      if (isSyncing) return; // Prevent multiple sync operations

      try {
        setIsSyncing(true);
        setSyncError(null);

        if (showToast) {
          toast({
            title: 'Syncing data...',
            description: 'Fetching the latest data from the server.',
            duration: 3000,
          });
        }

        logMessage(
          LogLevel.INFO,
          'useOfficerDashboardSync',
          'Starting dashboard sync'
        );

        // Simulate network request
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // In a real implementation, you would fetch data from your API here
        // const response = await fetch('/api/dashboard-data');
        // const data = await response.json();

        // Update last sync time
        const now = new Date();
        setLastSyncTime(now.toISOString());
        setSyncSuccess(true);

        if (showToast) {
          toast({
            title: 'Sync completed',
            description: 'Dashboard data has been updated successfully.',
            duration: 3000,
          });
        }

        logMessage(
          LogLevel.INFO,
          'useOfficerDashboardSync',
          'Dashboard sync completed successfully'
        );
      } catch (error) {
        logMessage(
          LogLevel.ERROR,
          'useOfficerDashboardSync',
          'Error syncing dashboard data',
          { error }
        );
        setSyncSuccess(false);
        setSyncError(
          error instanceof Error ? error.message : 'Unknown error during sync'
        );

        if (showToast) {
          toast({
            title: 'Sync failed',
            description: 'There was an error syncing the dashboard data.',
            variant: 'destructive',
            duration: 5000,
          });
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [isSyncing, toast]
  );

  return {
    isSyncing,
    syncSuccess,
    lastSyncTime,
    syncError,
    syncDashboardData,
  };
}
