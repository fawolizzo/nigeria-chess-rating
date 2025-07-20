import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';

interface SyncStatusMonitorProps {
  isSyncing: boolean;
  syncSuccess: boolean;
  lastSyncTime: string;
  onSyncClick: () => void;
  syncError: string | null;
}

export const SyncStatusMonitor: React.FC<SyncStatusMonitorProps> = ({
  isSyncing,
  syncSuccess,
  lastSyncTime,
  onSyncClick,
  syncError,
}) => {
  return (
    <div className="flex items-center gap-2">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {lastSyncTime ? (
          <span>Last synced: {formatDate(lastSyncTime)}</span>
        ) : syncSuccess ? (
          <span>Sync complete</span>
        ) : syncError ? (
          <span className="text-red-500">Sync failed</span>
        ) : (
          <span>Not synced</span>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onSyncClick}
        disabled={isSyncing}
        className="h-8 px-2"
      >
        <RefreshCw
          className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`}
        />
        {isSyncing ? 'Syncing...' : 'Sync'}
      </Button>
    </div>
  );
};

export default SyncStatusMonitor;
