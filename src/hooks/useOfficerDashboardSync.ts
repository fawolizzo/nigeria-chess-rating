
import { useState, useEffect, useCallback, useRef } from "react";
import { syncStorage, forceSyncAllStorage } from "@/utils/storageUtils";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function useOfficerDashboardSync() {
  const { forceSync } = useUser();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncInProgressRef = useRef(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Function to sync all relevant data for the dashboard with debounce
  const syncDashboardData = useCallback(async () => {
    // Prevent multiple concurrent syncs
    if (syncInProgressRef.current) {
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Sync already in progress, skipping');
      return false;
    }
    
    try {
      syncInProgressRef.current = true;
      setIsSyncing(true);
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Starting dashboard data sync');
      
      // First sync the user data to ensure we have latest permissions
      await forceSync();
      
      // Then sync all storage with a timeout to prevent UI freezing
      const syncPromise = new Promise<boolean>((resolve) => {
        // Set a maximum timeout to prevent hanging
        const timeoutId = setTimeout(() => {
          logMessage(LogLevel.WARNING, 'useOfficerDashboardSync', 'Sync operation timed out, continuing anyway');
          resolve(false);
        }, 5000);
        
        // Perform the actual sync
        forceSyncAllStorage()
          .then(() => {
            clearTimeout(timeoutId);
            resolve(true);
          })
          .catch((error) => {
            logMessage(LogLevel.ERROR, 'useOfficerDashboardSync', 'Error in forceSyncAllStorage:', error);
            clearTimeout(timeoutId);
            resolve(false);
          });
      });
      
      await syncPromise;
      
      // Finally ensure critical keys are synced
      await Promise.all([
        syncStorage(['ncr_users']),
        syncStorage(['ncr_players']),
        syncStorage(['ncr_tournaments'])
      ]);
      
      setLastSyncTime(new Date());
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Dashboard data sync completed');
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardSync', 'Error syncing dashboard data:', error);
      toast({
        title: "Sync Error",
        description: "There was an error syncing the dashboard data",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSyncing(false);
      // Add a small delay before allowing another sync
      setTimeout(() => {
        syncInProgressRef.current = false;
      }, 1000);
    }
  }, [forceSync, toast]);
  
  // Clear any existing timeouts when unmounting
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);
  
  // Set up auto-sync on component mount with longer interval
  useEffect(() => {
    // Clear any existing interval
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Initial sync
    syncDashboardData();
    
    // Set up timeout for regular syncs with a longer interval (2 minutes)
    // This is much less frequent to prevent UI freezing
    syncTimeoutRef.current = setTimeout(() => {
      syncDashboardData();
    }, 120000); // Every 2 minutes
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncDashboardData]);
  
  return {
    syncDashboardData,
    isSyncing,
    lastSyncTime
  };
}
