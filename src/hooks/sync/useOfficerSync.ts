
import { useState, useCallback, useRef } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
import { useSyncStorage } from "./useSyncStorage";
import { useToastManager } from "./useToastManager";
import { useSyncRetry } from "./useSyncRetry";
import { useSyncLifecycle } from "./useSyncLifecycle";

/**
 * Hook for managing dashboard data synchronization for officers
 */
export function useOfficerSync() {
  const { forceSync } = useUser();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  
  // Refs for tracking sync state
  const syncInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  
  // Custom hooks for specific functionality
  const { syncStorage } = useSyncStorage();
  const { refreshToastIdRef, manageToastDisplay } = useToastManager();
  const { retryCountRef, maxRetries, scheduleRetry } = useSyncRetry();
  const { setupSyncLifecycle } = useSyncLifecycle(syncDashboardData);
  
  // Enhanced sync function with better error handling
  const syncDashboardData = useCallback(async (showToast = false) => {
    // Prevent multiple concurrent syncs
    if (syncInProgressRef.current || !mountedRef.current) {
      return false;
    }
    
    syncInProgressRef.current = true;
    
    try {
      if (mountedRef.current) {
        setIsSyncing(true);
        setSyncError(undefined);
      }
      
      logMessage(LogLevel.INFO, 'useOfficerSync', 'Starting dashboard data sync');
      
      // Show toast if requested
      if (showToast) {
        manageToastDisplay("Syncing Data", "Syncing dashboard data with the latest updates...");
      }
      
      // First sync the user data
      try {
        await Promise.race([
          forceSync(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('User sync timed out')), 8000))
        ]);
      } catch (userSyncError) {
        logMessage(LogLevel.WARNING, 'useOfficerSync', 'Issue syncing user data:', userSyncError);
        // Continue with other data sync even if user sync fails
      }
      
      try {
        // Run syncs in sequence rather than parallel for better reliability
        await syncStorage('ncr_users', 5000);
        await syncStorage('ncr_players', 5000);
        await syncStorage('ncr_tournaments', 5000);
      } catch (storageError) {
        const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
        logMessage(LogLevel.WARNING, 'useOfficerSync', 'Issue with storage sync:', errorMessage);
        
        if (mountedRef.current) {
          setSyncError(errorMessage);
        }
        
        // Handle partial failure with retry logic
        if (retryCountRef.current < maxRetries) {
          const shouldRetry = await scheduleRetry(syncDashboardData);
          
          // Return false to indicate sync had an issue
          if (!shouldRetry) return false;
        } else {
          // If we've exhausted retries, reset the counter but continue
          retryCountRef.current = 0;
        }
      }
      
      if (mountedRef.current) {
        setLastSyncTime(new Date());
        setSyncSuccess(true);
        setSyncError(undefined);
      }
      
      // Only show success toast for manual sync operations
      if (showToast && mountedRef.current) {
        toast({
          title: "Dashboard Updated",
          description: "Dashboard data has been refreshed successfully",
          duration: 2000,
        });
      }
      
      logMessage(LogLevel.INFO, 'useOfficerSync', 'Dashboard data sync completed');
      retryCountRef.current = 0;
      
      // Clear the toast ID reference
      refreshToastIdRef.current = null;
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(LogLevel.ERROR, 'useOfficerSync', 'Error syncing dashboard data:', error);
      
      if (mountedRef.current) {
        setSyncSuccess(false);
        setSyncError(errorMessage);
        
        if (showToast) {
          toast({
            title: "Sync Error",
            description: "There was an error syncing the dashboard data. Please try again.",
            variant: "destructive",
            duration: 5000,
          });
        }
      }
      
      // Clear the toast ID reference
      refreshToastIdRef.current = null;
      
      return false;
    } finally {
      if (mountedRef.current) setIsSyncing(false);
      
      // Add a delay before releasing the lock
      setTimeout(() => {
        syncInProgressRef.current = false;
      }, 1000);
    }
  }, [forceSync, toast, syncStorage, manageToastDisplay, scheduleRetry, maxRetries]);
  
  // Set up lifecycle management
  setupSyncLifecycle();
  
  return {
    syncDashboardData,
    isSyncing,
    syncSuccess,
    lastSyncTime,
    syncError,
    mountedRef
  };
}
