
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Wifi, WifiOff, AlertCircle, Check, RefreshCw, Loader2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requestDataSync } from "@/utils/deviceSync";
import { useUser } from "@/contexts/UserContext";

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
  const [syncRetryCount, setSyncRetryCount] = useState(0);
  const { toast } = useToast();
  const { forceSync } = useUser();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log("[SyncIndicator] Device came online, auto-syncing");
      handleSync(false);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      console.log("[SyncIndicator] Device went offline");
      
      if (isSyncing) {
        setSyncStatus('error');
        
        toast({
          title: "Sync Interrupted",
          description: "You are offline. Sync will resume when you reconnect.",
          variant: "warning",
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial sync
    if (isOnline) {
      console.log("[SyncIndicator] Running initial sync");
      handleSync(false);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async (showToast = true) => {
    if (isSyncing) {
      console.log("[SyncIndicator] Sync already in progress, ignoring request");
      return;
    }
    
    if (!isOnline) {
      console.log("[SyncIndicator] Cannot sync while offline");
      
      if (showToast) {
        toast({
          title: "Cannot Sync",
          description: "You are currently offline. Please connect to the internet.",
          variant: "warning",
        });
      }
      
      return;
    }
    
    try {
      console.log("[SyncIndicator] Starting data sync");
      setIsSyncing(true);
      setSyncStatus('syncing');
      
      // Request sync from other devices
      console.log("[SyncIndicator] Requesting sync from other devices");
      await requestDataSync();
      
      // Allow some time for responses to arrive (progressive timeout for retries)
      const waitTime = Math.min(1500 + (syncRetryCount * 500), 5000);
      console.log(`[SyncIndicator] Waiting ${waitTime}ms for sync responses`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Force local sync
      console.log("[SyncIndicator] Forcing local sync");
      const success = await forceSync();
      
      if (success) {
        console.log("[SyncIndicator] Sync completed successfully");
        setLastSynced(new Date());
        setSyncStatus('success');
        setSyncRetryCount(0);
        
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
        console.warn("[SyncIndicator] Sync completed with warnings");
        setLastSynced(new Date());
        setSyncStatus('error');
        setSyncRetryCount(prev => prev + 1);
        
        if (showToast) {
          toast({
            title: "Sync Warning",
            description: syncRetryCount > 1 
              ? "Multiple sync attempts have produced warnings. Some data may not be up to date."
              : "Synchronization completed with warnings. Some data may not be up to date.",
            variant: "warning",
          });
        }
        
        // Reset error status after 3 seconds
        setTimeout(() => {
          setSyncStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error("[SyncIndicator] Error during manual sync:", error);
      setSyncStatus('error');
      setSyncRetryCount(prev => prev + 1);
      
      if (showToast) {
        toast({
          title: "Sync Failed",
          description: syncRetryCount > 1 
            ? "Multiple sync attempts have failed. Please check your connection or try refreshing the page."
            : "Failed to synchronize data. Please try again.",
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

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else {
      return date.toLocaleTimeString();
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
            <span className="ml-1 flex items-center">
              • <Clock className="h-2.5 w-2.5 mx-0.5" /> {formatTimeAgo(lastSynced)}
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
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
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
           syncStatus === 'error' ? "Try Again" : 
           !isOnline ? "Offline" : "Sync Now"}
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
