
import { useState, useEffect, useCallback, useRef } from "react";
import { syncStorage } from "@/utils/storageUtils";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function useOfficerDashboardSync() {
  const { forceSync } = useUser();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Optimized sync function with better error handling
  const syncDashboardData = useCallback(async (showToast = false) => {
    // Prevent multiple concurrent syncs
    if (syncInProgressRef.current || !mountedRef.current) {
      return false;
    }
    
    syncInProgressRef.current = true;
    
    try {
      if (mountedRef.current) setIsSyncing(true);
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Starting dashboard data sync');
      
      // First sync the user data to ensure we have latest permissions
      await forceSync();
      
      // Only sync critical keys
      await Promise.all([
        syncStorage(['ncr_users']),
        syncStorage(['ncr_players']),
        syncStorage(['ncr_tournaments'])
      ]);
      
      if (mountedRef.current) {
        setLastSyncTime(new Date());
        setSyncSuccess(true);
      }
      
      // Only show toast for manual sync operations
      if (showToast && mountedRef.current) {
        toast({
          title: "Dashboard Updated",
          description: "Dashboard data has been refreshed successfully",
        });
      }
      
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Dashboard data sync completed');
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardSync', 'Error syncing dashboard data:', error);
      
      if (mountedRef.current) {
        setSyncSuccess(false);
        
        if (showToast) {
          toast({
            title: "Sync Error",
            description: "There was an error syncing the dashboard data",
            variant: "destructive"
          });
        }
      }
      
      return false;
    } finally {
      if (mountedRef.current) setIsSyncing(false);
      
      // Add a delay before releasing the lock to prevent rapid subsequent syncs
      setTimeout(() => {
        syncInProgressRef.current = false;
      }, 1000);
    }
  }, [forceSync, toast]);
  
  // Only sync once on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Small delay before initial sync to allow UI to render first
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        syncDashboardData();
      }
    }, 100);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [syncDashboardData]);
  
  return {
    syncDashboardData,
    isSyncing,
    syncSuccess,
    lastSyncTime
  };
}
