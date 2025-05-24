
import { useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/hooks/use-toast";
import { logMessage, LogLevel } from "@/utils/debugLogger";
// import { useSyncStorage } from "./useSyncStorage"; // Removed as primary data sync is via context
// import { useToastManager } from "./useToastManager"; // Toast will be handled by the calling component or directly here
// import { useSyncRetry } from "./useSyncRetry"; // Retry logic will be part of context refresh if needed
// import { useSyncLifecycle } from "./useSyncLifecycle"; // Lifecycle also tied to context
import { useDashboard } from "@/contexts/officer/OfficerDashboardContext";

/**
 * Hook for managing dashboard data synchronization for officers.
 * This hook now primarily reflects the state of the OfficerDashboardContext.
 */
export function useOfficerSync() {
  const { forceSync: forceUserSync } = useUser(); // Renamed to avoid conflict if useDashboard also has forceSync
  const { 
    refreshDashboard, 
    isLoading: isDashboardLoading, 
    hasError: dashboardHasError, 
    dataError: dashboardDataError, // Assuming context provides specific error message
    lastLoadTime 
  } = useDashboard();
  const { toast } = useToast();

  const syncDashboardData = useCallback(async (showToast = false) => {
    logMessage(LogLevel.INFO, 'useOfficerSync', 'Manual dashboard data refresh triggered');
    if (showToast) {
      toast({
        title: "Refreshing Dashboard",
        description: "Fetching the latest dashboard data...",
      });
    }

    try {
      // Optionally, sync user-specific data if it's separate from dashboard data
      // await forceUserSync(); 
      // For now, focusing on dashboard data refresh. User sync is often part of initial load.

      await refreshDashboard(); // This should trigger loading states in useDashboard

      if (showToast) {
        // Success toast can be shown here if refreshDashboard doesn't have its own,
        // or if we want to explicitly confirm the manual sync action.
        // However, if useDashboard handles its own success/error toasts on refresh, this might be redundant.
        // For now, assuming refreshDashboard itself will indicate success/failure via its states.
        // Let's rely on the change in `lastLoadTime` and absence of `dashboardHasError` as success.
      }
      return true; // Indicate the action was triggered
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logMessage(LogLevel.ERROR, 'useOfficerSync', 'Error during manual dashboard refresh:', error);
      if (showToast) {
        toast({
          title: "Refresh Error",
          description: `Failed to refresh dashboard data: ${errorMessage}`,
          variant: "destructive",
        });
      }
      return false; // Indicate the action failed
    }
  }, [refreshDashboard, toast]); // Removed forceUserSync for now, can be added if needed

  // The sync status now directly reflects the state from OfficerDashboardContext
  const isSyncing = isDashboardLoading;
  const syncSuccess = dashboardHasError === null ? null : !dashboardHasError; // null if no load yet, true if no error, false if error
  const syncError = dashboardDataError || (dashboardHasError ? "An error occurred while fetching dashboard data." : undefined);
  
  // mountedRef might not be needed if lifecycle is tied to component using this hook
  // or if context handles its own data fetching lifecycle robustly.
  // Removing for simplification unless specific unmount-related cleanup becomes necessary.

  return {
    syncDashboardData, // This is the function to manually trigger a refresh
    isSyncing,
    syncSuccess,
    lastSyncTime: lastLoadTime, // Use lastLoadTime from the context
    syncError,
    // mountedRef // Removed for simplification
  };
}
