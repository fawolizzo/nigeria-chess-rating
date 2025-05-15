
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
  const [syncError, setSyncError] = useState<string | undefined>(undefined);
  const syncInProgressRef = useRef(false);
  const mountedRef = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const refreshToastIdRef = useRef<string | null>(null);
  const MAX_RETRIES = 2;
  
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
      
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Starting dashboard data sync');
      
      // Clear any previous timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Show toast if requested and not already showing
      if (showToast && !refreshToastIdRef.current) {
        // Clean up any existing toast first
        if (refreshToastIdRef.current) {
          toast.dismiss(refreshToastIdRef.current);
        }
        
        const { id } = toast({
          title: "Syncing Data",
          description: "Syncing dashboard data with the latest updates...",
          duration: 3000,
        });
        refreshToastIdRef.current = id;
      }
      
      // First sync the user data
      try {
        await Promise.race([
          forceSync(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('User sync timed out')), 8000))
        ]);
      } catch (userSyncError) {
        logMessage(LogLevel.WARNING, 'useOfficerDashboardSync', 'Issue syncing user data:', userSyncError);
        // Continue with other data sync even if user sync fails
      }
      
      // Sync critical data with explicit timeouts
      const syncStorageWithTimeout = async (key: string, timeoutMs: number) => {
        return Promise.race([
          syncStorage([key]),
          new Promise<void>((_, reject) => 
            setTimeout(() => reject(new Error(`${key} sync timed out after ${timeoutMs}ms`)), timeoutMs)
          )
        ]);
      };
      
      try {
        // Run syncs in sequence rather than parallel for better reliability
        await syncStorageWithTimeout('ncr_users', 5000);
        await syncStorageWithTimeout('ncr_players', 5000);
        await syncStorageWithTimeout('ncr_tournaments', 5000);
      } catch (storageError) {
        const errorMessage = storageError instanceof Error ? storageError.message : String(storageError);
        logMessage(LogLevel.WARNING, 'useOfficerDashboardSync', 'Issue with storage sync:', errorMessage);
        
        if (mountedRef.current) {
          setSyncError(errorMessage);
        }
        
        // Handle partial failure with retry logic
        if (retryCountRef.current < MAX_RETRIES) {
          retryCountRef.current++;
          logMessage(LogLevel.INFO, 'useOfficerDashboardSync', `Scheduling retry ${retryCountRef.current}/${MAX_RETRIES}`);
          
          // Schedule a retry with exponential backoff
          const retryDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 5000);
          
          syncTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              syncDashboardData(false);
            }
          }, retryDelay);
          
          // Return false to indicate sync had an issue
          return false;
        }
        
        // If we've exhausted retries, reset the counter but continue
        retryCountRef.current = 0;
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
      
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Dashboard data sync completed');
      retryCountRef.current = 0;
      
      // Clear the toast ID reference
      refreshToastIdRef.current = null;
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(LogLevel.ERROR, 'useOfficerDashboardSync', 'Error syncing dashboard data:', error);
      
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
  }, [forceSync, toast]);
  
  // Set up initial sync on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Small delay before initial sync
    const timer = setTimeout(() => {
      if (mountedRef.current) {
        syncDashboardData();
      }
    }, 1000);
    
    // Periodic background sync every 5 minutes
    const intervalId = setInterval(() => {
      if (mountedRef.current && !syncInProgressRef.current) {
        syncDashboardData();
      }
    }, 5 * 60 * 1000);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      clearInterval(intervalId);
      
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      // Dismiss any remaining toast
      if (refreshToastIdRef.current) {
        toast.dismiss(refreshToastIdRef.current);
      }
    };
  }, [syncDashboardData, toast]);
  
  return {
    syncDashboardData,
    isSyncing,
    syncSuccess,
    lastSyncTime,
    syncError
  };
}
