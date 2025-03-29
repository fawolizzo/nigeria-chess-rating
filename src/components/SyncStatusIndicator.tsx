
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import useSilentSync from '@/hooks/useSilentSync';
import { Button } from '@/components/ui/button';
import { STORAGE_KEY_USERS } from '@/types/userTypes';
import { logMessage, LogLevel } from '@/utils/debugLogger';

interface SyncStatusIndicatorProps {
  onSyncComplete?: () => void;
  prioritizeUserData?: boolean;
}

const SyncStatusIndicator = ({ 
  onSyncComplete,
  prioritizeUserData = true
}: SyncStatusIndicatorProps) => {
  const [showStatus, setShowStatus] = useState(false);
  const [showStatusTimeout, setShowStatusTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Use the silent sync hook with user data prioritization
  const { sync, forceSync, isSyncing, lastSyncSuccess, lastSyncTime } = useSilentSync({
    syncOnMount: true,
    keys: prioritizeUserData ? [STORAGE_KEY_USERS] : undefined,
    syncInterval: null,
    prioritizeUserData,
    onSyncComplete: () => {
      if (onSyncComplete) onSyncComplete();
      
      setShowStatus(true);
      
      // Hide the status after a delay
      if (showStatusTimeout) {
        clearTimeout(showStatusTimeout);
      }
      
      const timeoutId = setTimeout(() => {
        setShowStatus(false);
      }, 3000);
      
      setShowStatusTimeout(timeoutId);
    },
    onSyncError: (error) => {
      logMessage(LogLevel.ERROR, 'SyncStatusIndicator', 'Sync error:', error);
      setShowStatus(true);
      
      // Hide the error after a longer delay
      if (showStatusTimeout) {
        clearTimeout(showStatusTimeout);
      }
      
      const timeoutId = setTimeout(() => {
        setShowStatus(false);
      }, 5000);
      
      setShowStatusTimeout(timeoutId);
    }
  });
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (showStatusTimeout) {
        clearTimeout(showStatusTimeout);
      }
    };
  }, [showStatusTimeout]);
  
  const handleManualSync = async () => {
    try {
      setShowStatus(true);
      
      // Use forceSync instead of sync for manual syncs
      // forceSync prioritizes user data
      await forceSync();
      
      // Status will be auto-hidden by the onSyncComplete callback
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SyncStatusIndicator', 'Manual sync error:', error);
    }
  };
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'never';
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!showStatus && !isSyncing) {
    return (
      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          onClick={handleManualSync}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Sync data
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center">
        {isSyncing ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin text-blue-500" />
            <span className="text-blue-500">Syncing data...</span>
          </>
        ) : lastSyncSuccess ? (
          <>
            <Check className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500">Data synced at {formatTime(lastSyncTime)}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3 mr-1 text-amber-500" />
            <span className="text-amber-500">Sync failed. Try again.</span>
          </>
        )}
      </div>
      
      {!isSyncing && (
        <Button
          variant="ghost"
          size="sm"
          className="text-xs py-1 h-6"
          onClick={handleManualSync}
          disabled={isSyncing}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? 'Syncing...' : 'Sync now'}
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
