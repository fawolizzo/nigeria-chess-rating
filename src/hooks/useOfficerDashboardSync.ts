
import { useState, useEffect, useCallback, useRef } from "react";
import { syncStorage } from "@/utils/storageUtils";
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
  const syncLockRef = useRef(false);
  
  // Optimized sync function with debounce and better error handling
  const syncDashboardData = useCallback(async (showToast = false) => {
    // Prevent multiple concurrent syncs with lock
    if (syncInProgressRef.current || syncLockRef.current) {
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Sync already in progress or locked, skipping');
      return false;
    }
    
    // Set locks to prevent multiple syncs
    syncInProgressRef.current = true;
    syncLockRef.current = true;
    
    try {
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
      
      // Release the immediate lock
      syncInProgressRef.current = false;
      
      // Add a delay before releasing the lock to prevent rapid subsequent syncs
      setTimeout(() => {
        syncLockRef.current = false;
      }, 3000); // 3 second cooldown between syncs
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
  
  // Only sync once on mount - CRITICAL fix to prevent multiple 100% loading indicators
  useEffect(() => {
    // If sync is already in progress or locked, don't start another one
    if (syncLockRef.current || syncInProgressRef.current) return;
    
    // Clear any existing interval
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    // Set lock to prevent additional syncs during mount
    syncLockRef.current = true;
    
    // Small delay before initial sync to allow UI to render first
    const timer = setTimeout(() => {
      syncDashboardData().finally(() => {
        // Release lock after sync completes
        syncLockRef.current = false;
      });
    }, 100);
    
    return () => {
      clearTimeout(timer);
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
