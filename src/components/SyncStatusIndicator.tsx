import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import useSilentSync from '@/hooks/useSilentSync';
import { Button } from '@/components/ui/button';
import { STORAGE_KEY_USERS } from '@/utils/storageUtils';
import { logMessage, LogLevel } from '@/utils/debugLogger';
import { detectPlatform } from '@/utils/storageSync';

interface SyncStatusIndicatorProps {
  onSyncComplete?: () => void;
  prioritizeUserData?: boolean;
  forceShow?: boolean;
}

const SyncStatusIndicator = ({ 
  onSyncComplete,
  prioritizeUserData = true,
  forceShow = false
}: SyncStatusIndicatorProps) => {
  const [showStatus, setShowStatus] = useState(false);
  const [showStatusTimeout, setShowStatusTimeout] = useState<NodeJS.Timeout | null>(null);
  const platform = detectPlatform();
  
  // IMPORTANT: Always hide in production environments regardless of forceShow parameter
  // This ensures sync indicators are never visible to end users
  const isProduction = import.meta.env.PROD;
  
  // If in production, don't render anything at all
  if (isProduction) {
    return null;
  }
  
  // Always prioritize user data during sync to ensure login credentials are available
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
      
      logMessage(LogLevel.INFO, 'SyncStatusIndicator', `Sync completed successfully on ${platform.type}${prioritizeUserData ? ' with user data prioritized' : ''}`);
    },
    onSyncError: (error) => {
      logMessage(LogLevel.ERROR, 'SyncStatusIndicator', `Sync error on ${platform.type}:`, error);
      setShowStatus(true);
      
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
      
      logMessage(LogLevel.INFO, 'SyncStatusIndicator', `Manual sync initiated with user data prioritized on ${platform.type}`);
      await forceSync();
      
      // Status will be auto-hidden by the onSyncComplete callback
    } catch (error) {
      logMessage(LogLevel.ERROR, 'SyncStatusIndicator', `Manual sync error on ${platform.type}:`, error);
    }
  };
  
  const formatTime = (date: Date | null) => {
    if (!date) return 'never';
    
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Development-only UI for sync controls
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center">
        {isSyncing ? (
          <>
            <RefreshCw className="h-3 w-3 mr-1 animate-spin text-blue-500" />
            <span className="text-blue-500">Syncing data on {platform.type}...</span>
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
