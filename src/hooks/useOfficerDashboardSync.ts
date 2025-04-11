
import { useState, useEffect, useCallback } from "react";
import { syncStorage, forceSyncAllStorage } from "@/utils/storageUtils";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";

export function useOfficerDashboardSync() {
  const { forceSync } = useUser();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Function to sync all relevant data for the dashboard
  const syncDashboardData = useCallback(async () => {
    // Prevent multiple concurrent syncs
    if (isSyncing) return false;
    
    try {
      setIsSyncing(true);
      logMessage(LogLevel.INFO, 'useOfficerDashboardSync', 'Starting dashboard data sync');
      
      // First sync the user data to ensure we have latest permissions
      await forceSync();
      
      // Then sync all storage
      await forceSyncAllStorage();
      
      // Finally ensure critical keys are synced
      await syncStorage(['ncr_users']);
      await syncStorage(['ncr_players']);
      await syncStorage(['ncr_tournaments']);
      
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
    }
  }, [forceSync, isSyncing, toast]);
  
  // Set up auto-sync on component mount
  useEffect(() => {
    // Initial sync
    syncDashboardData();
    
    // Set up interval for regular syncs
    const intervalId = setInterval(() => {
      syncDashboardData();
    }, 30000); // Every 30 seconds to reduce UI freezing
    
    return () => clearInterval(intervalId);
  }, [syncDashboardData]);
  
  return {
    syncDashboardData,
    isSyncing,
    lastSyncTime
  };
}
