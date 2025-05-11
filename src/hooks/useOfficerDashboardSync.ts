
import { useState, useEffect, useCallback, useRef } from "react";
import { syncStorage } from "@/utils/storageUtils";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { withTimeout } from "@/utils/monitorSync";

export function useOfficerDashboardSync() {
  const { forceSync } = useUser();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 3;
  
  // Enhanced sync function with better error handling and retry mechanism
  const syncDashboardData = useCallback(async (showToast = false) => {
    // Prevent multiple concurrent syncs
    if (syncInProgressRef.current || !mountedRef.current) {
      return false;
    }
    
    syncInProgressRef.current = true;
    
    try {
      if (mountedRef.current) setIsSyncing(true);
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Starting dashboard data sync');
      
      // Clear any previous timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // First sync the user data to ensure we have latest permissions
      try {
        await withTimeout(
          forceSync, 
          'User Data Sync',
          4000,
          () => {
            logMessage(LogLevel.WARNING, 'useOfficerDashboardSync', 'User data sync timed out');
            return false;
          }
        );
      } catch (userSyncError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardSync', 'Issue syncing user data:', userSyncError);
        // Continue to try syncing other data even if user sync fails
      }
      
      // Only sync critical keys with improved timeout handling
      try {
        await Promise.all([
          withTimeout(
            () => syncStorage(['ncr_users']), 
            'Users Storage Sync', 
            3000
          ),
          withTimeout(
            () => syncStorage(['ncr_players']), 
            'Players Storage Sync', 
            3000
          ),
          withTimeout(
            () => syncStorage(['ncr_tournaments']), 
            'Tournaments Storage Sync', 
            3000
          )
        ]);
      } catch (storageError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardSync', 'Issue with storage sync:', storageError);
        
        // Handle partial failure - data might still be usable
        if (retryCountRef.current < MAX_RETRIES) {
          logMessage(LogLevel.INFO, 'useOfficerDashboardSync', `Scheduling retry ${retryCountRef.current + 1}/${MAX_RETRIES}`);
          retryCountRef.current++;
          
          // Schedule a retry with exponential backoff
          syncTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              syncDashboardData(false);
            }
          }, Math.min(1000 * retryCountRef.current, 5000));
        }
      }
      
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
      retryCountRef.current = 0; // Reset retry counter on success
      return true;
    } catch (error) {
      logMessage(LogLevel.ERROR, 'useOfficerDashboardSync', 'Error syncing dashboard data:', error);
      
      if (mountedRef.current) {
        setSyncSuccess(false);
        
        if (showToast) {
          toast({
            title: "Sync Error",
            description: "There was an error syncing the dashboard data. Please try again.",
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
    }, 500);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [syncDashboardData]);
  
  return {
    syncDashboardData,
    isSyncing,
    syncSuccess,
    lastSyncTime
  };
}
