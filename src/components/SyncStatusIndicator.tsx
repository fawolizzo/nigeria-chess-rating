
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Wifi, WifiOff } from "lucide-react";
import { forceSyncAllStorage } from "@/utils/storageUtils";
import { useToast } from "@/hooks/use-toast";

interface SyncStatusIndicatorProps {
  className?: string;
  showButton?: boolean;
}

const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  className = "", 
  showButton = true 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
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
      
      const success = await forceSyncAllStorage();
      
      if (success) {
        setLastSynced(new Date());
        if (showToast) {
          toast({
            title: "Sync Successful",
            description: "Your data has been synchronized across all devices.",
          });
        }
      } else if (showToast) {
        toast({
          title: "Sync Warning",
          description: "Synchronization completed with warnings. Some data may not be up to date.",
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error during manual sync:", error);
      if (showToast) {
        toast({
          title: "Sync Failed",
          description: "Failed to synchronize data. Please try again.",
          variant: "destructive",
        });
      }
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
          className="ml-2 h-6 px-2 text-xs"
          onClick={() => handleSync()}
          disabled={isSyncing || !isOnline}
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? "Syncing..." : "Sync Now"}
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
