
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff, AlertCircle, Check } from "lucide-react";
import { forceSyncAllStorage } from "@/utils/storageUtils";
import { forceGlobalSync } from "@/utils/storageSync";
import { useToast } from "@/hooks/use-toast";

interface SyncStatusIndicatorProps {
  className?: string;
  showButton?: boolean;
  onSyncComplete?: () => void;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = "", 
  showButton = true,
  onSyncComplete
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync
    handleSync(false);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async (showToast = true) => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      setSyncStatus('syncing');
      
      // Use the global sync to ensure all devices are updated
      const success = await forceGlobalSync();
      
      if (success) {
        setLastSynced(new Date());
        setSyncStatus('success');
        
        if (showToast) {
          toast({
            title: "Sync Successful",
            description: "Your data has been synchronized across all devices.",
          });
        }
        
        // Call the onSyncComplete callback if provided
        if (onSyncComplete) {
          onSyncComplete();
        }
        
        // Reset success status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      } else {
        setSyncStatus('error');
        
        if (showToast) {
          toast({
            title: "Sync Warning",
            description: "Synchronization completed with warnings. Some data may not be up to date.",
            variant: "warning",
          });
        }
        
        // Reset error status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error("Error during manual sync:", error);
      setSyncStatus('error');
      
      if (showToast) {
        toast({
          title: "Sync Failed",
          description: "Failed to synchronize data. Please try again.",
          variant: "destructive",
        });
      }
      
      // Reset error status after 3 seconds
      setTimeout(() => {
        setSyncStatus('idle');
      }, 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
        {isOnline ? (
          <Wifi className="h-3 w-3 mr-1 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 mr-1 text-red-500" />
        )}
        <span>
          {isOnline ? "Online" : "Offline"}
          {lastSynced && isOnline && (
            <span className="ml-1">
              • Last synced: {lastSynced.toLocaleTimeString()}
            </span>
          )}
        </span>
      </div>
      
      {showButton && (
        <Button
          variant="ghost"
          size="sm"
          className={`ml-2 h-6 px-2 text-xs ${
            syncStatus === 'success' ? 'text-green-500' : 
            syncStatus === 'error' ? 'text-red-500' : ''
          }`}
          onClick={() => handleSync()}
          disabled={isSyncing || !isOnline}
        >
          {syncStatus === 'syncing' && (
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          )}
          {syncStatus === 'success' && (
            <Check className="h-3 w-3 mr-1 text-green-500" />
          )}
          {syncStatus === 'error' && (
            <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
          )}
          {syncStatus === 'idle' && !isSyncing && (
            <RefreshCw className="h-3 w-3 mr-1" />
          )}
          {syncStatus === 'syncing' ? "Syncing..." : 
           syncStatus === 'success' ? "Synced" : 
           syncStatus === 'error' ? "Try Again" : "Sync Now"}
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
