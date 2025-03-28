
import React, { useState, useEffect } from "react";
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import useSilentSync from "@/hooks/useSilentSync";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface SyncStatusIndicatorProps {
  showButton?: boolean;
  className?: string;
  onSyncComplete?: () => void;
}

const SyncStatusIndicator = ({ 
  showButton = false, 
  className = "",
  onSyncComplete
}: SyncStatusIndicatorProps) => {
  const [syncTimeout, setSyncTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isSyncTimedOut, setIsSyncTimedOut] = useState(false);
  const { toast } = useToast();
  
  const { 
    sync, 
    isSyncing, 
    lastSyncSuccess, 
    lastSyncTime 
  } = useSilentSync({
    syncOnMount: true,
    keys: ['ncr_users', 'ncr_current_user', 'ncr_players', 'ncr_tournaments'],
    syncTimeout: 5000, // Reduced from 10000 to 5000 ms
    onSyncComplete: () => {
      // Clear the timeout if sync completes successfully
      if (syncTimeout) {
        clearTimeout(syncTimeout);
        setSyncTimeout(null);
      }
      setIsSyncTimedOut(false);
      
      if (onSyncComplete) {
        onSyncComplete();
      }
    },
    onSyncError: (error) => {
      console.error("Sync error:", error);
      setIsSyncTimedOut(true);
      
      toast({
        title: "Sync Error",
        description: "There was an issue syncing your data. You can continue using the app.",
        variant: "warning",
      });
    }
  });
  
  const handleManualSync = () => {
    // Reset timeout state
    setIsSyncTimedOut(false);
    
    // Set a timeout to show a message if sync takes too long
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      setIsSyncTimedOut(true);
      
      toast({
        title: "Sync Taking Longer Than Expected",
        description: "You can continue using the app while sync completes in the background.",
        variant: "warning",
      });
    }, 5000); // Reduced from 12000 to 5000 ms
    
    setSyncTimeout(timeoutId);
    
    // Trigger sync
    sync().catch(error => {
      console.error("Manual sync error:", error);
      
      toast({
        title: "Sync Error",
        description: "There was an issue syncing your data. You can continue using the app.",
        variant: "warning",
      });
    });
  };
  
  useEffect(() => {
    // Set a timeout for the initial sync
    const timeoutId = setTimeout(() => {
      setIsSyncTimedOut(true);
      
      // Only show a toast if initial sync times out
      if (isSyncing) {
        toast({
          title: "Initial Sync Taking Longer Than Expected",
          description: "You can continue using the app while sync completes in the background.",
          variant: "warning",
        });
      }
    }, 5000); // Reduced from 12000 to 5000 ms
    
    setSyncTimeout(timeoutId);
    
    // Clear timeout on unmount
    return () => {
      if (syncTimeout) {
        clearTimeout(syncTimeout);
      }
    };
  }, []);
  
  // Format the last sync time
  const formattedTime = lastSyncTime 
    ? new Intl.DateTimeFormat('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      }).format(lastSyncTime) 
    : null;
  
  return (
    <div className={cn("flex items-center text-xs text-gray-500 dark:text-gray-400", className)}>
      {isSyncing ? (
        <div className="flex items-center">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          <span>Syncing data...</span>
          
          {/* Timeout message */}
          {isSyncTimedOut && (
            <div className="ml-1 text-amber-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>Taking longer than usual</span>
            </div>
          )}
        </div>
      ) : lastSyncSuccess === null ? (
        <div className="flex items-center">
          <RefreshCw className="w-3 h-3 mr-1" />
          <span>Waiting for sync...</span>
          
          {/* Timeout message */}
          {isSyncTimedOut && (
            <div className="ml-1 text-amber-500 flex items-center">
              <AlertCircle className="w-3 h-3 mr-1" />
              <span>Sync timed out</span>
            </div>
          )}
        </div>
      ) : lastSyncSuccess ? (
        <div className="flex items-center">
          <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
          <span>
            Synced {formattedTime && <span className="opacity-75">at {formattedTime}</span>}
          </span>
        </div>
      ) : (
        <div className="flex items-center">
          <AlertCircle className="w-3 h-3 mr-1 text-amber-500" />
          <span>Sync issue. Try again.</span>
        </div>
      )}
      
      {showButton && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 text-xs h-6 px-2"
          onClick={handleManualSync}
          disabled={isSyncing}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Refresh
        </Button>
      )}
    </div>
  );
};

export default SyncStatusIndicator;
