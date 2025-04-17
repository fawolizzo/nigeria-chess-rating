
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
  
  // Optimized sync function with debounce and better error handling
  const syncDashboardData = useCallback(async (showToast = false) => {
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
      
      // Only sync critical keys - this is a major optimization
      await Promise.all([
        syncStorage(['ncr_users']),
        syncStorage(['ncr_players']),
        syncStorage(['ncr_tournaments'])
      ]);
      
      setLastSyncTime(new Date());
      
      // Only show toast for manual sync operations
      if (showToast) {
        toast({
          title: "Dashboard Updated",
          description: "Dashboard data has been refreshed",
        });
      }
      
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Dashboard data sync completed');
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardSync', 'Error syncing dashboard data:', error);
      if (showToast) {
        toast({
          title: "Sync Error",
          description: "There was an error syncing the dashboard data",
          variant: "destructive"
        });
      }
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
  
  // MAJOR CHANGE: Drastically reduced auto-sync frequency 
  // Only sync once on mount and after user actions
  useEffect(() => {
    // Clear any existing interval
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Initial sync when component mounts
    syncDashboardData();
    
    // REMOVED: Auto-refresh timeout has been removed entirely to stop blinking
    // Only sync once on mount and after explicit user actions
    
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
